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
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: "password",
      title: "Password",
      type: "string",
      description: "Passord for brukeren (dette er kun demonstrasjon av passord-implementering. Har ikke implementert kryptering - Kun Sanity)",
      validation: (Rule) => Rule.required().min(6),
    },
    {
      name: "gender",
      title: "Gender",
      type: "string",
      options: {
        list: [
          { title: "Mann", value: "Mann" },
          { title: "Kvinne", value: "Kvinne" },
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
      name: "image",
      title: "Profile Image",
      type: "image",
      options: {
        hotspot: true,
      },
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
  preview: {
    select: {
      title: "name",
      subtitle: "email",
      media: "image",
    },
  },
}
