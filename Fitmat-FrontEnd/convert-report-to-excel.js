const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// อ่านข้อมูลจาก Jest HTML Reporters result file
const resultFilePath = path.join(__dirname, 'jest-html-reporters-attach', 'jest_html_reporters', 'result.js');

if (!fs.existsSync(resultFilePath)) {
  console.error('❌ ไม่พบไฟล์ result.js');
  console.log('กรุณารัน test ก่อน: npm run test:report');
  process.exit(1);
}

// อ่านไฟล์และ extract JSON
const resultContent = fs.readFileSync(resultFilePath, 'utf-8');

// Extract JSON object จาก window.jest_html_reporters_callback__
const jsonMatch = resultContent.match(/window\.jest_html_reporters_callback__\((\{[\s\S]*\})\)/);
if (!jsonMatch) {
  console.error('❌ ไม่สามารถอ่านข้อมูลจาก result.js ได้');
  process.exit(1);
}

const testData = JSON.parse(jsonMatch[1]);

// สร้าง Excel Workbook
const workbook = XLSX.utils.book_new();

// ============================================
// Sheet 1: สรุปผลการทดสอบ (Summary)
// ============================================
const summaryData = [
  ['📊 รายงานผลการทดสอบ Frontend'],
  [],
  ['📈 สถิติโดยรวม'],
  ['รายการ', 'จำนวน'],
  ['ชุดการทดสอบทั้งหมด', testData.numTotalTestSuites],
  ['ชุดการทดสอบที่ผ่าน', testData.numPassedTestSuites],
  ['ชุดการทดสอบที่ล้มเหลว', testData.numFailedTestSuites],
  [],
  ['การทดสอบทั้งหมด', testData.numTotalTests],
  ['การทดสอบที่ผ่าน', testData.numPassedTests],
  ['การทดสอบที่ล้มเหลว', testData.numFailedTests],
  ['การทดสอบที่รอ', testData.numPendingTests],
  ['การทดสอบที่ TODO', testData.numTodoTests],
  [],
  ['เวลาทั้งหมด', `${((testData.endTime - testData.startTime) / 1000).toFixed(2)} วินาที`],
  ['สถานะ', testData.success ? '✅ ผ่านทั้งหมด' : '❌ มีบางส่วนล้มเหลว'],
];

const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

// ตั้งค่าความกว้างของคอลัมน์
summarySheet['!cols'] = [
  { wch: 30 },
  { wch: 15 },
];

XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปผล');

// ============================================
// Sheet 2: รายละเอียดการทดสอบทั้งหมด
// ============================================
const detailHeaders = [
  'ไฟล์',
  'ชุดการทดสอบ',
  'ชื่อการทดสอบ',
  'สถานะ',
  'เวลา (ms)',
  'ข้อความผิดพลาด',
];

const detailRows = [];

testData.testResults.forEach((testFile) => {
  const fileName = path.basename(testFile.testFilePath);
  const suiteName = fileName.replace('.test.tsx', '').replace('.test.ts', '');

  testFile.testResults.forEach((test) => {
    const fullTestName = test.ancestorTitles.length > 0
      ? `${test.ancestorTitles.join(' > ')} > ${test.title}`
      : test.title;

    const status = test.status === 'passed' 
      ? '✅ ผ่าน' 
      : test.status === 'failed' 
      ? '❌ ล้มเหลว' 
      : '⏸️ รอ';

    const errorMessage = test.failureMessages && test.failureMessages.length > 0
      ? test.failureMessages.join('\n')
      : '';

    detailRows.push([
      fileName,
      suiteName,
      fullTestName,
      status,
      test.duration || 0,
      errorMessage,
    ]);
  });
});

const detailData = [detailHeaders, ...detailRows];
const detailSheet = XLSX.utils.aoa_to_sheet(detailData);

// ตั้งค่าความกว้างของคอลัมน์
detailSheet['!cols'] = [
  { wch: 40 },  // ไฟล์
  { wch: 30 },  // ชุดการทดสอบ
  { wch: 50 },  // ชื่อการทดสอบ
  { wch: 15 },  // สถานะ
  { wch: 12 },  // เวลา
  { wch: 80 },  // ข้อความผิดพลาด
];

XLSX.utils.book_append_sheet(workbook, detailSheet, 'รายละเอียด');

// ============================================
// Sheet 3: สรุปตามไฟล์
// ============================================
const fileSummaryHeaders = [
  'ไฟล์',
  'ผ่าน',
  'ล้มเหลว',
  'ทั้งหมด',
  'เวลา (ms)',
  'อัตราความสำเร็จ (%)',
];

const fileSummaryRows = [];

testData.testResults.forEach((testFile) => {
  const fileName = path.basename(testFile.testFilePath);
  const numPassing = testFile.numPassingTests;
  const numFailing = testFile.numFailingTests;
  const numTotal = testFile.numTotalTests;
  const runtime = testFile.perfStats ? testFile.perfStats.runtime : 0;
  const successRate = numTotal > 0 ? ((numPassing / numTotal) * 100).toFixed(2) : 0;

  fileSummaryRows.push([
    fileName,
    numPassing,
    numFailing,
    numTotal,
    runtime,
    `${successRate}%`,
  ]);
});

// เรียงตามอัตราความสำเร็จ
fileSummaryRows.sort((a, b) => {
  const rateA = parseFloat(a[5]);
  const rateB = parseFloat(b[5]);
  return rateA - rateB;
});

const fileSummaryData = [fileSummaryHeaders, ...fileSummaryRows];
const fileSummarySheet = XLSX.utils.aoa_to_sheet(fileSummaryData);

// ตั้งค่าความกว้างของคอลัมน์
fileSummarySheet['!cols'] = [
  { wch: 50 },  // ไฟล์
  { wch: 10 },  // ผ่าน
  { wch: 10 },  // ล้มเหลว
  { wch: 10 },  // ทั้งหมด
  { wch: 12 },  // เวลา
  { wch: 18 },  // อัตราความสำเร็จ
];

XLSX.utils.book_append_sheet(workbook, fileSummarySheet, 'สรุปตามไฟล์');

// ============================================
// Sheet 4: การทดสอบที่ล้มเหลว (ถ้ามี)
// ============================================
const failedTests = [];

testData.testResults.forEach((testFile) => {
  const fileName = path.basename(testFile.testFilePath);
  
  testFile.testResults.forEach((test) => {
    if (test.status === 'failed') {
      const fullTestName = test.ancestorTitles.length > 0
        ? `${test.ancestorTitles.join(' > ')} > ${test.title}`
        : test.title;

      const errorMessage = test.failureMessages && test.failureMessages.length > 0
        ? test.failureMessages.join('\n')
        : 'ไม่มีข้อความผิดพลาด';

      failedTests.push([
        fileName,
        fullTestName,
        test.duration || 0,
        errorMessage,
      ]);
    }
  });
});

if (failedTests.length > 0) {
  const failedHeaders = [
    'ไฟล์',
    'ชื่อการทดสอบ',
    'เวลา (ms)',
    'ข้อความผิดพลาด',
  ];

  const failedData = [failedHeaders, ...failedTests];
  const failedSheet = XLSX.utils.aoa_to_sheet(failedData);

  failedSheet['!cols'] = [
    { wch: 40 },
    { wch: 50 },
    { wch: 12 },
    { wch: 100 },
  ];

  XLSX.utils.book_append_sheet(workbook, failedSheet, 'การทดสอบที่ล้มเหลว');
}

// ============================================
// บันทึกไฟล์ Excel
// ============================================
const outputPath = path.join(__dirname, 'รายงานผลการทดสอบ_Frontend.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ แปลงข้อมูลเรียบร้อยแล้ว!');
console.log(`📄 ไฟล์ Excel: ${outputPath}`);
console.log(`\n📊 สถิติ:`);
console.log(`   - ชุดการทดสอบ: ${testData.numTotalTestSuites} (ผ่าน: ${testData.numPassedTestSuites}, ล้มเหลว: ${testData.numFailedTestSuites})`);
console.log(`   - การทดสอบ: ${testData.numTotalTests} (ผ่าน: ${testData.numPassedTests}, ล้มเหลว: ${testData.numFailedTests})`);
console.log(`   - เวลา: ${((testData.endTime - testData.startTime) / 1000).toFixed(2)} วินาที`);

