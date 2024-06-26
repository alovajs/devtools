import './api/index.ts';
const data2 = await Apis.pet.findPetsByTags({
  params: {
    tags: []
  },
  transformData() {
    return {};
  }
});
