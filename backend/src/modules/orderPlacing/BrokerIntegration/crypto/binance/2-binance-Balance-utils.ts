import { Injectable, BadRequestException } from '@nestjs/common';
import { USDMClient } from 'binance'; // Assuming you have a Binance client library installed


@Injectable()
export class BinanceBalanceService {

// Fetching Cash Balance
  async getFutureBalance(
       userId: string,
       apiKey: string,
       apiSecret: string,
     ): Promise<any> {
       console.log(`Fetching futures balance for user ${userId}, apiKey: ${apiKey}`);
       const client = new USDMClient({
         api_key: apiKey,
         api_secret: apiSecret,
         recvWindow: 3000,
         /*
         axiosOptions: {
           proxy: {
             host: ipAddress,
             port: httpPort,
             auth: {
               username: ipUsername,
               password: ipPassword,
             },
           },
         },
         */
       });
       console.log('Futures client initialized:', client);
       let usdtBalance;
       try {
         const balances = await client.getBalanceV3();
         console.log('Futures balances:', balances);
         const usdtAsset = balances.find((asset) => asset.asset === 'USDT');
         if (!usdtAsset) {
           console.error('USDT balance not found in futures account');
           throw new BadRequestException('USDT balance not found in futures account');
         }
         usdtBalance = usdtAsset.availableBalance;
         const balance = parseFloat(usdtBalance).toFixed(2);
         return {
           balance: Number(balance),
           currency: 'USDT',
         };
       } catch (error) {
         console.error('Error fetching futures balance:', error);
         throw new BadRequestException('Failed to fetch futures balance');
       }
     }
 

// Fetching Futures Balance
  async getCashBalance(
       userId: string,
       apiKey: string,
       apiSecret: string,
     ): Promise<any> {
       console.log(`Fetching futures balance for user ${userId}, apiKey: ${apiKey}`);
       const client = new USDMClient({
         api_key: apiKey,
         api_secret: apiSecret,
         recvWindow: 3000,
         /*
         axiosOptions: {
           proxy: {
             host: ipAddress,
             port: httpPort,
             auth: {
               username: ipUsername,
               password: ipPassword,
             },
           },
         },
         */
       });
       console.log('Futures client initialized:', client);
       let usdtBalance;
     
       try {
         const balances = await client.getAccountTrades({ symbol: 'BTCUSDT', startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, endTime: Date.now() });
         console.log('Futures balances:', balances);
        // const usdtAsset = balances.find((asset) => asset.asset === 'USDT');
         
       } catch (error) {
         console.error('Error fetching futures balance:', error);
         throw new BadRequestException('Failed to fetch futures balance');
       }
     }
 
      
// Fetching Options Balance
  async getOptionBalance(): Promise<{ balance: number; currency: string }> {
    try {
      // Placeholder: Replace with actual Binance API call for options balance
      const response = await this.callBinanceApi('options/account');
      return {
        balance: parseFloat(response.availableBalance) || 0,
        currency: 'USDT',
      };
    } catch (error) {
      console.error('Error fetching options balance:', error);
      throw new BadRequestException('Failed to fetch options balance');
    }
  }

  private async callBinanceApi(endpoint: string): Promise<any> {
    // Implement actual Binance API client logic here
    // This is a mock implementation
    return new Promise((resolve) => {
      resolve({
        balances: [{ asset: 'USDT', free: '100.50' }],
        totalWalletBalance: '200.75',
        availableBalance: '50.25',
      });
    });
  }
}