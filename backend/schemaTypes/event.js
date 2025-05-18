export default {
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "date",
      title: "Date",
      type: "date",
    },
    {
      name: "venue",
      title: "Venue",
      type: "string",
    },
    {
      name: "city",
      title: "City",
      type: "string",
    },
    {
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Musikk", value: "Musikk" },
          { title: "Sport", value: "sport" },
          { title: "Teater og Show", value: "Teater og Show" },
        ],
      },
    },
  ],
}
