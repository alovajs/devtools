Apis.pet
  .getPetById({
    pathParams: {
      petId: 1
    }
  })
  .then(res => {
    console.log(res);
  });
