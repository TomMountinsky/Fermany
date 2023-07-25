
const signup = async (name, email, password, passwordConfirm) => {
    console.log(name, email, password, passwordConfirm)
    try {
    const res = await axios({
        method: 'POST',
        url: '/api/v1/users/signup',
        data: {
            name,
            email,
            password,
            passwordConfirm
        },
        withCredentials: true
    });
    console.log(res);
    } catch (err) {
        console.log(err.response.data);
    }

};


document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#passwordConfirm').value;
    signup(name, email, password, passwordConfirm);
}
);