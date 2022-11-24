create table carts (
	id uuid primary key default uuid_generate_v4(),
	created_at date not null default current_timestamp,
	updated_at date not null default current_timestamp
)

create table cart_items (
	cart_id uuid,
	product_id uuid,
	count integer,
	foreign key ("cart_id") references "carts" ("id")
)

CREATE extension if not exists "uuid-ossp"

insert into carts (id, created_at, updated_at) values
('1eb136f4-dda4-4b89-9b27-0ae548237b84', current_timestamp, current_timestamp)

insert into cart_items (cart_id, product_id, count) values
('1eb136f4-dda4-4b89-9b27-0ae548237b84', '0dab1842-64d1-4e37-99f0-46340f9d1aa3',3)
