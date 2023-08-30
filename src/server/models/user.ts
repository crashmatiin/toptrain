import * as bcrypt from 'bcrypt';

import {
  Column,
  DataType,
  Model,
  Table,
  IsEmail,
  ForeignKey,
  BelongsTo,
  HasMany,
  Scopes,
  HasOne
} from 'sequelize-typescript';
import { Op } from 'sequelize';

import { getUUID } from '../../utils';

export enum Roles {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ['password', 'updatedAt']
    }
  },
  withPassword: {
    attributes: {
      include: ['password'],
      exclude: ['updatedAt']
    }
  }
}))
@Table
export class User extends Model<User> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: () => getUUID()
  })
  id: string;

  @IsEmail
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      min: 6
    },
    set(value: string) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      // @ts-ignore
      this.setDataValue('password', hash);
    },
    get() {
      // @ts-ignore
      return this.getDataValue('password');
    }
  })
  password: string;

  @Column({
    type: DataType.STRING
  })
  image: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  role: Roles;

  @Column({
    type: DataType.STRING
  })
  city: string;

  @ForeignKey(() => Country)
  @Column({
    type: DataType.STRING
  })
  id_country: string;

  @Column({
    type: DataType.STRING
  })
  phone: string;

  @Column({
    type: DataType.TEXT
  })
  description: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  email_confirm: boolean;

  async passwordCompare(pwd: string) {
    return bcrypt.compareSync(pwd, this.password);
  }

  static async getUsersList(
      filter?: {
        role?: Roles[]
      },
      search?,
      sort: 'id' | 'email' | 'date' = 'date',
      order: 'ASC' | 'DESC' = 'DESC',
      limit?: number,
      offset?: number): Promise<unknown> {
    if (!filter) {
      filter = {};
    }

    // main_condition

    const main_condition: any = {};

    if (search) {
      main_condition.email = {
        [Op.iLike]: `%${search}%`
      };
    }

    if (filter.role) {
      main_condition.role = {
        [Op.in]: filter.role
      };
    }

    // Order

    let sort_condition: any = [];

    switch (sort) {
      case 'id': {
        sort_condition = ['id', order];
        break;
      }

      case 'email': {
        sort_condition = ['email', order];
        break;
      }

      case 'date': {
        sort_condition = ['createdAt', order];
        break;
      }
    }

    const users = await User.findAndCountAll({
      where: main_condition,
      order: [sort_condition],
      limit,
      offset
    });

    return users;
  }

  // Checks

  static async checkExistenceEmail(email: string): Promise<boolean> {
    const user = await User.count({
      where: {
        email,
        email_confirm: true
      }
    });

    return !!user; // boolean response
  }
}