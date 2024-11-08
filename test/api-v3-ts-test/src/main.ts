import './api';

async function main() {
  const res1 = await Apis.user.getUserByName({
    pathParams: {
      username: 'abc'
    }
  });
  console.log(res1);
}

main();
