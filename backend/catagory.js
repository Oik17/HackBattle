import mongoose from "mongoose";

const { Schema, model } = mongoose;

const catagorySchema = new Schema({
  healthcare: { type: Number },
  leisure: { type: Number },
  vacations: { type: Number },
  essentials: { type: Number },
  groceries: { type: Number },
  misc: { type: Number },
});
const Catagory= model ("catagory", catagoryschema);
export default Catagory