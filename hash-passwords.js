    const bcrypt = require('bcryptjs');
    
    const password = 'pass123';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    console.log('Plain Password:', password);
    console.log('Hashed Password:', hash);
