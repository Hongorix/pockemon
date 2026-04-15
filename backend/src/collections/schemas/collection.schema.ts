import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema({ _id: false })
export class CollectionItem {
  @Prop({ required: true })
  pokemonId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  species: string;

  @Prop({ required: true })
  weight: number;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  types: string[];
}

export const CollectionItemSchema =
  SchemaFactory.createForClass(CollectionItem);

@Schema({ timestamps: true })
export class Collection {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [CollectionItemSchema], default: [] })
  items: CollectionItem[];

  @Prop({ required: true })
  totalWeight: number;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
