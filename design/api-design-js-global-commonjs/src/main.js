const pet = await Apis.pet.getPetById({
  pathParams: {
    petId: 123
  }
});
