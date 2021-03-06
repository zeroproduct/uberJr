

CREATE TABLE drivers (
    driver_id integer NOT NULL,
    license_plate text NOT NULL,
    car_color text NOT NULL,
    car_year text NOT NULL,
    car_make text NOT NULL,
    is_active boolean DEFAULT false,
    timed_out boolean DEFAULT false,
    timeout_time integer NOT NULL
);




CREATE TABLE users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    is_driver boolean DEFAULT false
);





CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE users_id_seq OWNED BY users.id;



ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);



ALTER TABLE ONLY drivers
    ADD CONSTRAINT driver_pkey PRIMARY KEY (driver_id);




ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);



ALTER TABLE ONLY drivers
    ADD CONSTRAINT driver_id FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;



CREATE TABLE activedrivers (
    id integer NOT NULL,
    current_lat double precision,
    current_long double precision,
    paired boolean DEFAULT false
);

ALTER TABLE ONLY activedrivers
    ADD CONSTRAINT "activedrivers_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY activedrivers
    ADD CONSTRAINT id FOREIGN KEY (id) REFERENCES drivers(driver_id) ON DELETE CASCADE;



CREATE TABLE rides (
    rider_id integer NOT NULL,
    driver_id integer NOT NULL,
    pickup_lat double precision NOT NULL,
    pickup_long double precision NOT NULL,
    dest_lat double precision NOT NULL,
    dest_long double precision NOT NULL,
    accepted boolean DEFAULT false,
    pickedup boolean DEFAULT false,
    complete boolean DEFAULT false


);


ALTER TABLE ONLY rides
    ADD CONSTRAINT driver_id FOREIGN KEY (driver_id) REFERENCES activedrivers(id) ON DELETE CASCADE;

ALTER TABLE ONLY rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (driver_id);



CREATE TABLE riders (
    id integer NOT NULL,
    rider_id integer NOT NULL,
    origin_lat double precision,
    origin_long double precision,
    destination_lat double precision,
    destination_long double precision,
    paired boolean DEFAULT false
);



CREATE SEQUENCE "Riders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE "Riders_id_seq" OWNED BY riders.id;



ALTER TABLE ONLY riders ALTER COLUMN id SET DEFAULT nextval('"Riders_id_seq"'::regclass);



ALTER TABLE ONLY riders
    ADD CONSTRAINT "Riders_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY riders
    ADD CONSTRAINT rider_id FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE CASCADE;
