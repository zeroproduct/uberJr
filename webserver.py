from flask import Flask,request,render_template,jsonify,url_for,make_response,redirect,session
from flask_sqlalchemy import SQLAlchemy
import json
import tools
from datetime import datetime
import requests
from flask_bcrypt import Bcrypt
import googlemaps

gmaps = googlemaps.Client(key='AIzaSyDhoFXFuPUf6BZtqoTUsssx9on-PQYxo4w')
apiKey = "AIzaSyBSbiX832JWq30JrqzH4tj-HriK9eJhhNs"
app = Flask(__name__)
app.secret_key = '\x9a{\xfc\x86(0\x92=Y\xaf-\xdf\x05z\x91\xadL+\xdeP\xa3w\xc0\x07'
bcrypt = Bcrypt(app)
#used this to test if directions API was working as expected
#
# r = requests.get("https://maps.googleapis.com/maps/api/directions/json?origin=75+9th+Ave+New+York,+NY&destination=MetLife+Stadium+1+MetLife+Stadium+Dr+East+Rutherford,+NJ+07073&key=AIzaSyBSbiX832JWq30JrqzH4tj-HriK9eJhhNs")
# if r.status_code ==200:
#     response =r.content
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://luisschubert@localhost:5432/uberjr'
db = SQLAlchemy(app)

class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text)
    email = db.Column(db.Text, unique=True)
    password = db.Column(db.Text)
    is_driver = db.Column(db.Boolean)
    driver_rel = db.relationship('Drivers', backref='users', primaryjoin='Users.id == Drivers.driver_id', uselist=False)

    def __init__(self, name, email, password, is_driver):
        self.name = name
        self.email = email
        self.password = password
        self.is_driver = is_driver

    def __repr__(self):
        return '<User %r>' % self.name

class Drivers(db.Model):
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    license_plate = db.Column(db.Text)
    car_color = db.Column(db.Text)
    car_year = db.Column(db.Text)
    car_make = db.Column(db.Text)
    is_active = db.Column(db.Boolean)

    def __init__(self, driver_id, license_plate, car_color, car_year, car_make, is_active):
        self.driver_id = driver_id
        self.license_plate = license_plate
        self.car_color = car_color
        self.car_year = car_year
        self.car_make = car_make
        self.is_active = is_active
    def __repr__(self):
        return '<Driver %r>' % self.license_plate

class Riders(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    origin_lat = db.Column(db.Float)
    origin_long = db.Column(db.Float)
    destination_lat = db.Column(db.Float)
    destination_long = db.Column(db.Float)

    def __init__(self, origin_lat, origin_long, destination_lat, destination_long):
        self.origin_lat = origin_lat
        self.origin_long = origin_long
        self.destination_lat = destination_lat
        self.destination_long = destination_long

#ROUTES
@app.route("/")
def home():
    if 'email' in session:
        user = Users.query.filter_by(email = session['email']).first()
        print user.isDriver
        if user.isDriver == True:
            return redirect(url_for('driver'))
        else:
            return redirect(url_for('rider'))
    else:
        return render_template("login.html")

@app.route("/driver")
def driver():
    if 'email' not in session:
        return redirect(url_for('login'))
    user = Users.query.filter_by(email = session['email']).first()
    # do we need to check if an account with that email exists here? (redirect to signup page if nonexistent?)
    # might be unnecessary since we already check for that in the login API call?
    if user.is_driver == False:
        return redirect(url_for('rider'))
    else:
        return render_template("driver.html")

@app.route("/rider")
def rider():
    if 'email' not in session:
        return redirect(url_for('login'))
    user = Users.query.filter_by(email = session['email']).first()
    # do we need to check if an account with that email exists here? (redirect to signup page if nonexistent?)
    # might be unnecessary since we already check for that in the login API call?
    if user.is_driver == True:
        return redirect(url_for('driver'))
    else:
        return render_template("rider.html")

@app.route("/signup")
def signup():
    if 'email' in session:
        user = Users.query.filter_by(email = session['email']).first()
        if user.isDriver == True:
            return redirect(url_for('driver'))
        else:
            return redirect(url_for('rider'))
    else:
        return render_template("signup.html")

@app.route("/signupdriver")
def signupdriver():
    return render_template("signup-driver.html")

@app.route("/login")
def login():
    if 'email' in session:
        user = Users.query.filter_by(email = session['email']).first()
        if user.isDriver == True:
            return redirect(url_for('driver'))
        else:
            return redirect(url_for('rider'))
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    if 'email' not in session:
        return redirect(url_for('login'))
    session.pop('email', None)
    return redirect(url_for('home'))

@app.route("/geolocationTest")
def geolocationTest():
    return render_template("geolocationTest.html")

#API for the frontend to request estimate travel time/cost based on user GPS location and destination Address
@app.route("/api/getTravelTime", methods=['POST'])
def api_getTravelInfo():
    originLongitude  = request.json.get('longitude')
    originLatitude = request.json.get('latitude')
    destinationAddress = request.json.get('destinationAddress')
    estimatePickUpTime = request.json.get('estimatePickUpTime')

    originGPS ="%s,%s" % (originLatitude,originLongitude)

    #for now
    #get current systemtime
    departureTime = "now"

    #we should add departure time to this request based on the available drivers.
    #currently departure time is set to now.
    #departure time parameter is necessary to receive traffic information in the response.
    #there are 3 different modes for traffic calculation based on historical data. best_guess, pessimistic, optimistic.
    r = requests.get("https://maps.googleapis.com/maps/api/directions/json?origin=%s&destination=%s&key=%s&departure_time=%s" % (originGPS,destinationAddress,apiKey, departureTime))
    print r
    if r.status_code == 200:
        response = r.content
        travelTime, travelDistance = tools.extractTravelTime(response)
        travelCost = tools.calculateCost(travelTime,travelDistance)
        response = jsonify(estimateTime = travelTime, estimateCost = travelCost)
        print response
        return response
    else:
        return "error"

@app.route("/api/signup", methods=['POST'])
def api_signup():
    print(request.form)
    name = request.form.get('name')
    userEmail = request.form.get('email')
    password = request.form.get('password')
    confirmpassword = request.form.get('confirmpassword')
    status = request.form.get('isdriver')
    if (status == 'true'):
        licenseplate = request.form.get('licenseplate')
        color = request.form.get('color')
        year = request.form.get('year')
        make = request.form.get('make')
        print "name: %s, email: %s, password: %s, confirmpassword: %s, isdriver: %s, licenseplate: %s, color: %s, year: %s, make: %s" %(name,userEmail,password,confirmpassword,status,licenseplate,color,year,make)
    else:
        print "name: %s, email: %s, password: %s, confirmpassword: %s, isdriver: %s" %(name,userEmail,password,confirmpassword,status)
    user = Users.query.filter_by(email=userEmail).first()
    if user is None:
        if password == confirmpassword:
            hashedpw = bcrypt.generate_password_hash(password)
            if (status == 'true'):
                isDriver = True
            else:
                isDriver = False
            new_user = Users(name, userEmail, hashedpw, isDriver)
            db.session.add(new_user)
            db.session.commit()
            if (isDriver == True):
                isActive = False
                driveid = Users.query.filter_by(email=userEmail).first().id
                new_driver = Drivers(driveid, licenseplate, color, year, make, isActive)
                db.session.add(new_driver)
                db.session.commit()
                print 'driver account creation succeeded'
                resp = make_response(url_for('driver'))
                session['email'] = new_user.email
                return resp
            else:
                print 'rider account creation succeeded'
                resp = make_response(url_for('rider'))
                session['email'] = new_user.email
                return resp
    else:
        return status

@app.route("/api/login", methods=['POST'])
def api_login():
    userEmail = request.form.get('email')
    password = request.form.get('password')
    user = Users.query.filter_by(email=userEmail).first()
    if user is not None:
        #compare hashed password to hashed password in db
        if bcrypt.check_password_hash(user.password, password):
            #here we need to create a cookie for the client and return it along with the response
            if user.isDriver == True:
                print 'driver login succeeded'
                resp = make_response(url_for('driver'))
                session['email'] = user.email
                return resp
            else:
                print 'rider login succeeded'
                resp = make_response(url_for('rider'))
                session['email'] = user.email
                return resp
        else:
            print 'user\'s password is incorrect'
            return "Invalid password!"
    elif user is None:
        print 'user with that email does not exist'
        return "No account with that email was found!"
    else:
        #can't think of additional errors to be thrown
        #but if they exist print them here
        print "No idea??"
        return "No idea??"

@app.route("/api/rider", methods=['POST'])
def api_rider():
    ### Origin
    origin = request.form.get('origin')
    geocode_origin = gmaps.geocode(origin)
    parsed_origin = json.loads(json.dumps(geocode_origin))
    origin_lat = parsed_origin[0][u'geometry'][u'location'][u'lat']
    origin_long = parsed_origin[0][u'geometry'][u'location'][u'lng']
    print(origin_lat)
    print(origin_long)

    ### Destination
    destination = request.form.get('destination')
    geocode_destination = gmaps.geocode(destination)
    parsed_destination = json.loads(json.dumps(geocode_destination))
    destination_lat = parsed_destination[0][u'geometry'][u'location'][u'lat']
    destination_long = parsed_destination[0][u'geometry'][u'location'][u'lng']
    print(destination_lat)
    print(destination_long)

    ride = Riders(origin_lat, origin_long, destination_lat, destination_long)
    db.session.add(ride)
    db.session.commit()

    return redirect(url_for('rider'))

@app.route("/api/drive", methods=['POST'])
def api_drive():
    origin = request.form.get('origin')
    if status == 'true':
        user = Users.query.filter_by(email = session['email']).first()
        return "added to ready to drive pool"
    else:
        return "not added to ready to drive pool"

if __name__ == '__main__':
    app.run(debug=True)
