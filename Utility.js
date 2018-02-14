var clamp = function(v, min, max)
{
	return Math.max(min, Math.min(v, max));
}

/*
 * Given a point |p| and a line l represented by the points |l1| and |l2|,
 * calculates the shortest distance and the point on the line which is closest to |p|.
 * returns an object with properties |intersectionPoint| and |dist|.
*/
var pointToLineDistance = function(p, l1, l2)
{
	let ret = {};

	let v = Vector2D.sub(l2, l1);
	let w = Vector2D.sub(p, l1);

	let c1 = w.dot(v);
	if (c1 <= 0) { // before l1
		ret.dist = Vector2D.sub(l1, p).length();
		ret.intersectionPoint = Vector2D.clone(l1);
		return ret;
	}

	let c2 = v.dot(v);
	if (c2 <= c1) { // after l2
		ret.dist = Vector2D.sub(l2, p).length();
		ret.intersectionPoint = Vector2D.clone(l2);
		return ret;
	}

	// between l1 and l2
	let b = c1 / c2;
	ret.intersectionPoint = Vector2D.add(l1, v.mult(b));
	ret.dist = Vector2D.sub(p, ret.intersectionPoint).length();
	return ret;
}
