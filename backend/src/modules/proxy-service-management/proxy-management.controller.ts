import { Controller, Get, Post, Put, Delete, Param, Body, HttpStatus } from '@nestjs/common';
import { CreateProxyDto, UpdateProxyDto } from './dto/proxy-management.dto';
import { ProxyService } from './proxy-management.schema';


@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

 
}