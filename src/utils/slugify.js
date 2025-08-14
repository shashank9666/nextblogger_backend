import slugify from "slugify";

export const makeSlug = (input, options = {}) => {
  return slugify(input, {
    replacement: "-",
    lower: true,
    strict: true,
    trim: true,
    ...options
  });
};
