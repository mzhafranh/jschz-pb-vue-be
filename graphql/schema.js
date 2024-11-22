const { buildSchema } = require('graphql');
const Phonebook = require('../models/Phonebook');

const schema = buildSchema(`
    type Phonebook {
        id: ID
        name: String
        phone: String
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

    type Mutation {
        addPhonebook(name: String!, phone:String!): Phonebook
        updatePhonebook(id: ID!, name: String, phone: String): Phonebook
        deletePhonebook(id: ID!): Phonebook
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

    return {phonebooks, page:realPage, limit:realLimit, pages, total}
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
    return await Phonebook.findByIdAndDelete(id);
  },
};

module.exports = { schema, rootValue };