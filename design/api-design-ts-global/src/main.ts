import { useRequest } from 'alova';
// test
const method = Apis.user.userLogin(
  { username: '', password: '' },
  {
    name: '123',
    params: {
      a: 1,
      b: 2
    },
    cache: 'force-cache',
    credentials: 'same-origin'
    // transformData(data, headers) {
    //   return !!data.success;
    // }
  }
);

const { data, loading, send } = useRequest(method, {
  initialData: {},
  immediate: false
});

Apis.pet.getPetById({ petId: 1 });
