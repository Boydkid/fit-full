-- CreateTable
CREATE TABLE `MembershipPurchase` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `targetRole` ENUM('USER', 'USER_BRONZE', 'USER_GOLD', 'USER_PLATINUM', 'TRAINER', 'ADMIN') NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `amount` INTEGER NULL,
    `currency` VARCHAR(191) NULL,
    `gateway` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MembershipPurchase_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MembershipPurchase` ADD CONSTRAINT `MembershipPurchase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
