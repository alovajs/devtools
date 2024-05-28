// test
const loginRes = await Apis.user.userLogin(
  { username: '', password: '' },
  {
    name: '123',
    params: {
      a: 1,
      b: 2
    },
    cache: 'force-cache',
    credentials: 'same-origin'
    // transformData: (data, headers) => {
    //   return !!data.success;
    // }
  }
);

const petRes = await Apis.pet.getPetById({ petId: 1 });
