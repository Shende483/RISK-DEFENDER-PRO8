import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EntryCountDocument = HydratedDocument<EntryCountType>;

@Schema({ timestamps: true, collection: 'binance-future-entry-counts' })
export class EntryCountType {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  date: string; // Stores the date in YYYY-MM-DD format for daily tracking

  @Prop({ type: Number, required: true, default: 0 })
  totalDailyEntryCount: number; // Total entries for the user on this date

  @Prop({
    type: [{ symbol: String, entryCount: Number }],
    required: true,
    default: [],
  })
  symbolCounts: { symbol: string; entryCount: number }[]; // Array of symbol and their entry counts

  @Prop({ type: String })
  subbroker?: string; // Optional field for subbroker
}

export const EntryCountSchema = SchemaFactory.createForClass(EntryCountType);

