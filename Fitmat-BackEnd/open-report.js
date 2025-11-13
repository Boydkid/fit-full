// Script to open test report in browser
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const reportPath = path.join(__dirname, 'jest_html_reporters.html');

if (fs.existsSync(reportPath)) {
  const command = process.platform === 'win32' 
    ? `start "" "${reportPath}"`
    : process.platform === 'darwin'
    ? `open "${reportPath}"`
    : `xdg-open "${reportPath}"`;
  
  exec(command, (error) => {
    if (error) {
      console.error('Error opening report:', error);
      return;
    }
    console.log('✅ Test report opened in browser!');
  });
} else {
  console.error('❌ Report file not found. Run "npm run test:report" first.');
}


