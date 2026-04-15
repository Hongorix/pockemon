import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PokemonService } from './pokemon.service';

class PokemonQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 24;

  @IsOptional()
  @IsString()
  search?: string;
}

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get('by-id/:id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.getPokemonById(id).then((pokemon) => {
      if (!pokemon) {
        throw new NotFoundException(`Pokemon #${id} not found`);
      }
      return pokemon;
    });
  }

  @Get()
  list(@Query() query: PokemonQueryDto) {
    return this.pokemonService.list(query.page, query.limit, query.search);
  }
}
