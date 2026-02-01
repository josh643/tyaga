import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address.');
  process.exit(1);
}

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'tyaga.sqlite',
  entities: [User],
  synchronize: false,
});

AppDataSource.initialize()
  .then(async () => {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    user.role = UserRole.ADMIN;
    await userRepository.save(user);

    console.log(`User ${email} has been promoted to ADMIN.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during Data Source initialization', error);
    process.exit(1);
  });
