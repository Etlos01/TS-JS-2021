import { IFriend } from '../interfaces/IFriend';
import { Db, Collection } from "mongodb";
import bcrypt from "bcryptjs";
import { ApiError } from '../errors/errors';
import Joi, { ValidationError } from "joi"

const BCRYPT_ROUNDS = 10;

const USER_INPUT_SCHEMA = Joi.object({
  firstName: Joi.string().min(2).max(40).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(4).max(30).required(),
  email: Joi.string().email().required()
})

class FriendsFacade {
  db: Db
  friendCollection: Collection

  constructor(db: Db) {
    this.db = db;
    this.friendCollection = db.collection("friends");
  }

  /**
   * 
   * @param friend 
   * @throws ApiError if validation fails
   */
  async addFriend(friend: IFriend): Promise<{ id: string }> {
    const status = USER_INPUT_SCHEMA.validate(friend);
    if (status.error) {
      throw new ApiError(status.error.message, 400)
    }
    const hashedpw = await bcrypt.hash(friend.password, BCRYPT_ROUNDS);
    const f = { ...friend, password: hashedpw, role: 'user' }
    const result = await this.friendCollection.insertOne(f)
    return result.insertedId
  }

  /**
   * TODO
   * @param email 
   * @param friend 
   * @throws ApiError if validation fails or friend was not found
   */
  async editFriend(email: string, friend: IFriend): Promise<{ modifiedCount: number }> {
    const status = USER_INPUT_SCHEMA.validate(friend);
    if (status.error) {
      throw new ApiError(status.error.message, 400)
    }
    const hashedpw = await bcrypt.hash(friend.password, BCRYPT_ROUNDS);
    const f = { ...friend, password: hashedpw }
    const result = await this.friendCollection.updateOne(
      { email },
      {
        $set: {
          firstName: f.firstName, lastName: f.lastName, email: f.email, password: f.password
        }
      }
    )
    if (result.modifiedCount === 0) {
      throw new ApiError("User email not found", 404)
    }
    return ({ modifiedCount: 1 })
  }

  /**
   * 
   * @param friendEmail 
   * @returns true if deleted otherwise false
   */
  async deleteFriend(friendEmail: string): Promise<boolean> {
    const status = await this.friendCollection.deleteOne({ email: friendEmail })
    if (status.deletedCount === 0) {
      return false
    }
    return true
  }

  async getAllFriends(): Promise<Array<IFriend>> {
    const users: unknown = await this.friendCollection.find({}).toArray();
    if (users === null) {
      throw new ApiError("it seems youve lost your friends?")
    }
    return users as Array<IFriend>
  }
  
  /**
   * 
   * @param friendEmail 
   * @returns 
   * @throws ApiError if not found
   */
  async getFrind(friendEmail: string): Promise<IFriend> {
    const friend = await this.friendCollection.findOne({ email: friendEmail })
    if (friend.email !== friendEmail) {
      throw new ApiError("", 400)
    }
    return friend
  }

  /**
   * Use this method for authentication
   * @param friendEmail 
   * @param password 
   * @returns the user if he could be authenticated, otherwise null
   */
  async getVerifiedUser(friendEmail: string, password: string): Promise<IFriend | null> {
    const friend: IFriend = await this.friendCollection.findOne({ email: friendEmail })
    if (friend && await bcrypt.compare(password, friend.password)) {
      return friend
    }
    return Promise.resolve(null)
  }

}

export default FriendsFacade;

