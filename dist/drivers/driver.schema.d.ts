import { Document, Types } from 'mongoose';
export type DriverDocument = Driver & Document;
export declare class Driver {
    userId: Types.ObjectId;
    isOnline: boolean;
    location: {
        latitude: number;
        longitude: number;
    };
    totalEarnings: number;
    rating: number;
    ratingCount: number;
    vehicleNumber?: string;
    vehicleType?: string;
    alternativePhone?: string;
    tankSizes?: number[];
}
export declare const DriverSchema: import("mongoose").Schema<Driver, import("mongoose").Model<Driver, any, any, any, (Document<unknown, any, Driver, any, import("mongoose").DefaultSchemaOptions> & Driver & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Driver, any, import("mongoose").DefaultSchemaOptions> & Driver & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Driver>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Driver, Document<unknown, {}, Driver, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isOnline?: import("mongoose").SchemaDefinitionProperty<boolean, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<{
        latitude: number;
        longitude: number;
    }, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalEarnings?: import("mongoose").SchemaDefinitionProperty<number, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rating?: import("mongoose").SchemaDefinitionProperty<number, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ratingCount?: import("mongoose").SchemaDefinitionProperty<number, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vehicleNumber?: import("mongoose").SchemaDefinitionProperty<string | undefined, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    vehicleType?: import("mongoose").SchemaDefinitionProperty<string | undefined, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    alternativePhone?: import("mongoose").SchemaDefinitionProperty<string | undefined, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tankSizes?: import("mongoose").SchemaDefinitionProperty<number[] | undefined, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Driver>;
