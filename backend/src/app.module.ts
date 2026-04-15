import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { CollectionsModule } from './collections/collections.module';
import { PokemonModule } from './pokemon/pokemon.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/pockemon',
    ),
    CollectionsModule,
    PokemonModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
