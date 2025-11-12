import { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../utils/prisma";

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body as {
    name?: string;
    description?: string;
  };

  if (!name) {
    return res.status(400).json({ message: "name is required." });
  }

  // requireAdmin middleware ensures role already; double-check for safety
  const authUser = (req as any).authUser;
  if (!authUser) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  try {
    const category = await prisma.classCategory.create({
      data: {
        name,
        description,
      },
    });

    return res.status(201).json(category);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Category name already exists." });
    }

    console.error("Failed to create category", error);
    return res.status(500).json({ message: "Failed to create category." });
  }
};

export const listCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.classCategory.findMany({
      orderBy: { createdAt: "asc" },
    });

    return res.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return res.status(500).json({ message: "Failed to fetch categories." });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body as {
    name?: string;
    description?: string;
  };

  const authUser = (req as any).authUser;
  if (!authUser) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  if (!id) {
    return res.status(400).json({ message: "Category id is required." });
  }

  const categoryId = Number(id);
  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: "Category id must be a valid number." });
  }

  try {
    const existingCategory = await prisma.classCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found." });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const updatedCategory = await prisma.classCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    return res.json(updatedCategory);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Category name already exists." });
    }

    console.error("Failed to update category", error);
    return res.status(500).json({ message: "Failed to update category." });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const authUser = (req as any).authUser;

  if (!authUser) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  if (!id) {
    return res.status(400).json({ message: "Category id is required." });
  }

  const categoryId = Number(id);
  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: "Category id must be a valid number." });
  }

  try {
    const existingCategory = await prisma.classCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { classes: true } },
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found." });
    }

    // ตรวจสอบว่ามี class ที่ใช้ category นี้อยู่หรือไม่
    if (existingCategory._count.classes > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It is used by ${existingCategory._count.classes} class(es).`,
      });
    }

    await prisma.classCategory.delete({
      where: { id: categoryId },
    });

    return res.json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Failed to delete category", error);
    return res.status(500).json({ message: "Failed to delete category." });
  }
};
