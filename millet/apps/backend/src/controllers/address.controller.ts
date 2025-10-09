import { Request, Response } from 'express';
import { asyncHandler }from '../utils/Api';
import * as AddressService from '../services/address.service';
import { ApiResponse } from '../utils/Api';

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const newAddress = await AddressService.addAddress(userId, req.body);
  res.status(201).json(new ApiResponse(201, newAddress, 'Address created successfully'));
});

export const getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addresses = await AddressService.getAddresses(userId);
  res.status(200).json(new ApiResponse(200, addresses, 'Addresses retrieved successfully'));
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const updatedAddress = await AddressService.editAddress(id!, userId, req.body);
  res.status(200).json(new ApiResponse(200, updatedAddress, 'Address updated successfully'));
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  await AddressService.removeAddress(id!, userId);
  res.status(200).json(new ApiResponse(200, {}, 'Address deleted successfully'));
});