export const compare = jest.fn().mockResolvedValue(true);
export const compareSync = jest.fn().mockReturnValue(true);
export const genSalt = jest.fn().mockResolvedValue('$2a$10$fakesaltfakesaltfakesaltfake');
export const genSaltSync = jest.fn().mockReturnValue('$2a$10$fakesaltfakesaltfakesaltfake');
export const hash = jest.fn().mockResolvedValue('$2a$10$fakehashfakehashfakehashfake');
export const hashSync = jest.fn().mockReturnValue('$2a$10$fakehashfakehashfakehashfake');
export const getRounds = jest.fn().mockReturnValue(10);
export const getSalt = jest.fn().mockReturnValue('$2a$10$fakesaltfakesaltfakesaltfake'); 