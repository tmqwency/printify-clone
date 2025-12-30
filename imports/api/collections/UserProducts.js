import { Mongo } from "meteor/mongo";

export const UserProducts = new Mongo.Collection("userProducts");

// Schema will be enforced by methods
