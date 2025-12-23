#!/usr/bin/env node
import bcrypt from 'bcrypt';

const password = 'password123';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
