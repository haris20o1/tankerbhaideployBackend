import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UserPushToken, UserPushTokenSchema } from './user-push-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserPushToken.name, schema: UserPushTokenSchema }])
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}

