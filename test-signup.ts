import { signUp } from './src/actions/authActions';

async function test() {
  const formData = new FormData();
  formData.append('email', 'khailu973@gmail.com');
  formData.append('password', 'password123');
  try {
    const res = await signUp(formData);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
