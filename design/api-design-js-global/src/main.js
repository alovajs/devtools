import { useRequest } from 'alova';
import './api';
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
    credentials: 'same-origin',
    transformData: (data, headers) => {
      return !!data.success;
    }
  }
);

const { data, loading, send } = useRequest(method, {
  initialData: {},
  immediate: false
});

const res = await Apis.pet.getPetById({ petId: 1 });
