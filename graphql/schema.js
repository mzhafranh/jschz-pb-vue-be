const { buildSchema } = require('graphql');
const Phonebook = require('../models/Phonebook');

const schema = buildSchema(`
    type Phonebook {
        id: ID
        name: String
        phone: String
    }

    type Query {
        phonebooks(query: String, offset: Int!, limit: Int!): [Phonebook]
        phonebook(id: ID!): Phonebook
    }

    type Mutation {
        addPhonebook(name: String!, phone:String!): Phonebook
        updatePhonebook(id: ID!, name: String, phone: String): Phonebook
        deletePhonebook(id: ID!): Phonebook
    }
`)

const rootValue = {
    phonebooks: async ({ query, offset, limit }) => {
      const filter = {};
      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
        ];
      }
      return await Phonebook.find(filter)
      .skip(offset)
      .limit(limit);
    },
    phonebook: async ({ id }) => {
      return await Phonebook.findById(id);
    },
    addPhonebook: async ({ name, phone }) => {
      const phonebook = new Phonebook({ name, phone });
      return await phonebook.save();
    },
    updatePhonebook: async ({ id, name, phone}) => {
      return await Phonebook.findByIdAndUpdate(
        id,
        { name, phone },
        { new: true }
      );
    },
    deleteUser: async ({ id }) => {
      return await Phonebook.findByIdAndDelete(id);
    },
  };
  
  module.exports = { schema, rootValue };