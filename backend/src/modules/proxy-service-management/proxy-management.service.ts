import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProxyDto, UpdateProxyDto } from './dto/proxy-management.dto';
import { ProxyServiceDocument } from './proxy-management.schema';

@Injectable()
export class ProxyService {
  constructor(
    @InjectModel('ProxyService')
    private readonly proxyServiceModel: Model<ProxyServiceDocument>,
  ) {}

  async createProxy(createProxyDto: CreateProxyDto): Promise<ProxyServiceDocument> {
    try {
      const proxy = new this.proxyServiceModel(createProxyDto);
      return await proxy.save();
    } catch (error) {
      throw new BadRequestException('Failed to create proxy: ' + error.message);
    }
  }

  async getAllProxies(): Promise<ProxyServiceDocument[]> {
    return await this.proxyServiceModel.find().exec();
  }

  async getProxyById(id: string): Promise<ProxyServiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid proxy ID');
    }
    const proxy = await this.proxyServiceModel.findById(id).exec();
    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }
    return proxy;
  }

  async updateProxy(id: string, updateProxyDto: UpdateProxyDto): Promise<ProxyServiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid proxy ID');
    }
    const proxy = await this.proxyServiceModel
      .findByIdAndUpdate(id, { $set: updateProxyDto }, { new: true })
      .exec();
    if (!proxy) {
      throw new NotFoundException('Proxy not found');
    }
    return proxy;
  }

  async deleteProxy(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid proxy ID');
    }
    const result = await this.proxyServiceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Proxy not found');
    }
  }
}