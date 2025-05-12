export default {
    name: "user",
    title: "User",
    type: "document",
    fields: [
      {
        name: "name",
        title: "Name",
        type: "string",
        validation: (Rule) => Rule.required(),
      },
      {
        name: "gender",
        title: "Gender",
        type: "string",
        options: {
          list: [
            { title: "Male", value: "male" },
            { title: "Female", value: "female" },
            { title: "Other", value: "other" },
          ],
        },
      },
      {
        name: "age",
        title: "Age",
        type: "number",
      },
      {
        name: "previousPurchases",
        title: "Previous Purchases",
        type: "array",
        of: [{ type: "reference", to: [{ type: "event" }] }],
      },
      {
        name: "wishlist",
        title: "Wishlist",
        type: "array",
        of: [{ type: "reference", to: [{ type: "event" }] }],
      },
      {
        name: "friends",
        title: "Friends",
        type: "array",
        of: [{ type: "reference", to: [{ type: "user" }] }],
      },
    ],
  }
  