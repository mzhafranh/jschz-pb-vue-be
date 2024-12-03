const { buildSchema } = require('graphql');
const { GraphQLUpload } = require('graphql-upload');
const path = require('path');
const Phonebook = require('../models/Phonebook');
const fs = require('fs');

const schema = buildSchema(`
    type Phonebook {
        id: ID
        name: String
        phone: String
        avatar: String
    }

    type PhonebookResult {
      phonebooks: [Phonebook]
      page: Int
      limit: Int
      pages: Int
      total: Int
    }

    type Query {
        fetchPhonebooks(query: String, page: Int, limit: Int, sort: String): PhonebookResult
        selectPhonebook(id: ID!): Phonebook
    }

    scalar Upload

    type Mutation {
        addPhonebook(name: String!, phone:String!): Phonebook
        updatePhonebook(id: ID!, name: String, phone: String): Phonebook
        deletePhonebook(id: ID!): Phonebook
        uploadAvatar(id: ID!, avatar: Upload!): Phonebook
    }
`)

const rootValue = {
  fetchPhonebooks: async ({ query, page, limit, sort }) => {
    const realPage = page ? page : 1;
    const realSort = { ["name"]: sort === "asc" ? 1 : -1 };
    const realLimit = limit ? limit : 10;
    const offset = (realPage - 1) * limit;
    const filter = query ?
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
        ],
      } : {};

    const total = await Phonebook.countDocuments(filter);
    const pages = Math.ceil(total / realLimit)

    const phonebooks = await Phonebook.find(filter)
      .sort(realSort)
      .skip(offset)
      .limit(realLimit);

    return { phonebooks, page: realPage, limit: realLimit, pages, total }
  },
  selectPhonebook: async ({ id }) => {
    return await Phonebook.findById(id);
  },
  addPhonebook: async ({ name, phone }) => {
    const phonebook = new Phonebook({ name, phone });
    return await phonebook.save();
  },
  updatePhonebook: async ({ id, name, phone }) => {
    return await Phonebook.findByIdAndUpdate(
      id,
      { name, phone },
      { new: true }
    );
  },
  deletePhonebook: async ({ id }) => {
    try {
      const phonebookFind = await Phonebook.findById(id);
      if (!phonebookFind) {
        throw new Error('Phonebook entry not found');
      }
        const uploadedAvatarPath = path.join(__dirname, '..', 'public', 'uploads', phonebookFind.avatar);
  
      if (phonebookFind.avatar && fs.existsSync(uploadedAvatarPath)) {
        await fs.promises.unlink(uploadedAvatarPath);
      }
      const deletedPhonebook = await Phonebook.findByIdAndDelete(id);
      return deletedPhonebook; // Return the deleted document
    } catch (error) {
      console.error('Error deleting phonebook:', error);
      throw new Error(error.message);
    }
  },
  Upload: GraphQLUpload,
  uploadAvatar: async ({ id, avatar }) => {
    try {
      console.log('Received avatar:', avatar); // Log to inspect the avatar object
      const { createReadStream, filename } = await avatar;
      const phonebookFind = await Phonebook.findById(id);
      if (!phonebookFind) {
        throw new Error('Phonebook entry not found');
      }

      const username = phonebookFind.name;
      const avatarFilename = username + Date.now() + path.extname(filename);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', avatarFilename);

      const stream = createReadStream();
      await new Promise((resolve, reject) => {
        const writeStream = require('fs').createWriteStream(filePath);
        stream.pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      phonebookFind.avatar = avatarFilename;
      await phonebookFind.save();

      return phonebookFind;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(error.message);
    }
  }
};

module.exports = { schema, rootValue };