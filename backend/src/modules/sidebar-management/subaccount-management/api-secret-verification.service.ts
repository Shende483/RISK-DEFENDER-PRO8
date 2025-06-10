import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyVerificationService {
  async verifyMainApiSecret(
    body: {
      brokerKey: string;
      marketTypeId: string;
      mainApiKey: string;
      mainSecretKey: string;
    },
    userId: string,
  ): Promise<{ statusCode: number; message: string; success: boolean }> {
    const { brokerKey, marketTypeId, mainApiKey, mainSecretKey } = body;
    try {
      console.log('✅ Dummy verification for Main Account API keys:', {
        brokerKey,
        marketTypeId,
        mainApiKey,
        mainSecretKey,
      });
      return {
        statusCode: 200,
        message: 'Main Account API keys verified successfully',
        success: true,
      };
    } catch (error) {
      console.error('❌ Error verifying Main Account API keys:', error);
      return {
        statusCode: 500,
        message: 'Failed to verify Main Account API keys',
        success: false,
      };
    }
  }

  async verifySubApiSecret(
    body: {
      brokerKey: string;
      marketTypeId: string;
      subApiKey: string;
      subSecretKey: string;
    },
    userId: string,
  ): Promise<{ statusCode: number; message: string; success: boolean }> {
    const { brokerKey, marketTypeId, subApiKey, subSecretKey } = body;
    try {
      console.log('✅ Dummy verification for Sub-Account API keys:', {
        brokerKey,
        marketTypeId,
        subApiKey,
        subSecretKey,
      });
      return {
        statusCode: 200,
        message: 'Sub-Account API keys verified successfully',
        success: true,
      };
    } catch (error) {
      console.error('❌ Error verifying Sub-Account API keys:', error);
      return {
        statusCode: 500,
        message: 'Failed to verify Sub-Account API keys',
        success: false,
      };
    }
  }
}