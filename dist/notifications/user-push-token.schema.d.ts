import { Document, Types } from 'mongoose';
export type UserPushTokenDocument = UserPushToken & Document;
export declare class UserPushToken {
    userId: Types.ObjectId;
    expoPushToken: string;
}
export declare const UserPushTokenSchema: import("mongoose").Schema<UserPushToken, import("mongoose").Model<UserPushToken, any, any, any, (Document<unknown, any, UserPushToken, any, import("mongoose").DefaultSchemaOptions> & UserPushToken & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, UserPushToken, any, import("mongoose").DefaultSchemaOptions> & UserPushToken & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, UserPushToken>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserPushToken, Document<unknown, {}, UserPushToken, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserPushToken & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserPushToken, Document<unknown, {}, UserPushToken, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserPushToken & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expoPushToken?: import("mongoose").SchemaDefinitionProperty<string, UserPushToken, Document<unknown, {}, UserPushToken, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserPushToken & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserPushToken>;
