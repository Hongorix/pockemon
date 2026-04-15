import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCollectionItemDto {
  @IsInt()
  @Min(1)
  pokemonId: number;

  @IsString()
  @Length(1, 64)
  name: string;

  @IsString()
  @Length(1, 64)
  species: string;

  @IsInt()
  @Min(1)
  weight: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];
}

export class CreateCollectionDto {
  @IsString()
  @Length(2, 64)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCollectionItemDto)
  items: CreateCollectionItemDto[];
}
