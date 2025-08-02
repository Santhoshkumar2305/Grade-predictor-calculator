import mongoose from 'mongoose';

let cached=global.mongoose;
if(!cached) 
  cached=global.mongoose={conn:null,promise:null};

async function dbConnect(){
  if(cached.conn) 
    return cached.conn;
  if(!cached.promise){
    const opts={bufferCommands:false};
    cached.promise=mongoose.connect(process.env.MONGODB_URI,opts).then(m=>m);
  }
  try{
    cached.conn=await cached.promise;
    console.log('MongoDB Connected!');
    return cached.conn;
  }catch(err){
    console.error('MongoDB connection error:',err);
    throw err;
  }
}
export default dbConnect;
