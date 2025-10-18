import {prisma }from '@repo/db';
import { ApiError } from '../utils/Api';
import type { Address } from '@repo/db'; // Change this line

export const addAddress = async (userId: string, data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  return prisma.address.create({
    data: { ...data, userId },
  });
};

export const getAddresses = async (userId: string) => {
  return prisma.address.findMany({ where: { userId } });
};

export const editAddress = async (addressId: string, userId: string, data: Partial<Address>) => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new ApiError(404, 'Address not found or access denied');
  }
  return prisma.address.update({ where: { id: addressId }, data });
};

export const removeAddress = async (addressId: string, userId: string) => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new ApiError(404, 'Address not found or access denied');
  }
  await prisma.address.delete({ where: { id: addressId } });
};