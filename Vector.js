/////////////////////////////////////////////////////////////////////
//	Vector2D
//
//	Class for representing and manipulating 2D vectors
//
/////////////////////////////////////////////////////////////////////

// TODO: Type errors if v not instanceof Vector classes
// TODO: Possibly implement in C++

function Vector2D(x, y)
{
	if (arguments.length == 2)
		this.set(x, y);
	else
		this.set(0, 0);
}

// Mutating 2D functions
//
// These functions modify the current object,
// and always return this object to allow chaining

Vector2D.prototype.set = function(x, y)
{
	this.x = x;
	this.y = y;
	return this;
};

Vector2D.prototype.add = function(v)
{
	this.x += v.x;
	this.y += v.y;
	return this;
};

Vector2D.prototype.sub = function(v)
{
	this.x -= v.x;
	this.y -= v.y;
	return this;
};

Vector2D.prototype.mult = function(f)
{
	this.x *= f;
	this.y *= f;
	return this;
};

Vector2D.prototype.div = function(f)
{
	this.x /= f;
	this.y /= f;
	return this;
};

Vector2D.prototype.normalize = function()
{
	var mag = this.length();
	if (!mag)
		return this;

	return this.div(mag);
};

/**
 * Rotate a radians anti-clockwise
 */
Vector2D.prototype.rotate = function(a)
{
	var sin = Math.sin(a);
	var cos = Math.cos(a);
	var x = this.x * cos + this.y * sin;
	var y = this.y * cos - this.x * sin;
	this.x = x;
	this.y = y;
	return this;
};

// Numeric 2D info functions (non-mutating)
//
// These methods serve to get numeric info on the vector, they don't modify the vector

Vector2D.prototype.dot = function(v)
{
	return this.x * v.x + this.y * v.y;
};

// get the non-zero coordinate of the vector cross
Vector2D.prototype.cross = function(v)
{
	return this.x * v.y - this.y * v.x;
};

Vector2D.prototype.lengthSquared = function()
{
	return this.dot(this);
};

Vector2D.prototype.length = function()
{
	return Math.sqrt(this.lengthSquared());
};

/**
 * Compare this length to the length of v,
 * @return 0 if the lengths are equal
 * @return 1 if this is longer than v
 * @return -1 if this is shorter than v
 * @return NaN if the vectors aren't comparable
 */
Vector2D.prototype.compareLength = function(v)
{
	var dDist = this.lengthSquared() - v.lengthSquared();
	if (!dDist)
		return dDist == 0 ? 0 : NaN;
	return dDist < 0 ? -1 : 1;
};

Vector2D.prototype.distanceToSquared = function(v)
{
	var dx = this.x - v.x;
	var dy = this.y - v.y;
	return dx * dx + dy * dy;
};

Vector2D.prototype.distanceTo = function(v)
{
	return Math.sqrt(this.distanceToSquared(v));
};

// Static 2D functions
//
// Static functions that return a new vector object.
// Note that object creation is slow in JS, so use them only when necessary

Vector2D.clone = function(v)
{
	return new Vector2D(v.x, v.y);
};

Vector2D.from3D = function(v)
{
	return new Vector2D(v.x, v.z);
};

Vector2D.add = function(v1, v2)
{
	return new Vector2D(v1.x + v2.x, v1.y + v2.y);
};

Vector2D.sub = function(v1, v2)
{
	return new Vector2D(v1.x - v2.x, v1.y - v2.y);
};

Vector2D.mult = function(v, f)
{
	return new Vector2D(v.x * f, v.y * f);
};

Vector2D.div = function(v, f)
{
	return new Vector2D(v.x / f, v.y / f);
};

Vector2D.avg = function(vectorList)
{
	return Vector2D.sum(vectorList).div(vectorList.length);
};

Vector2D.sum = function(vectorList)
{
	var sum = new Vector2D();
	vectorList.forEach(function(v) {sum.add(v);});
	return sum;
};
