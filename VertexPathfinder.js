
// A vertex around the corners of an obstruction
// (paths will be sequences of these vertexes)
function Vertex()
{
	this.p = new Vector2D();
	this.g = 0.0;
	this.h = 0.0;
	this.pred = 0;
	this.status = 0;
	this.quadInward = 0; // the quadrant which is inside the shape (or NONE)
	this.quadOutward = 0; // the quadrants of the next point on the path which this vertex must be in, given 'pred'

	this.StatusEnum = {
		UNEXPLORED : 0,
		OPEN : 1,
		CLOSED : 2
	}
}

// Obstruction edges (paths will not cross any of these).
// Defines the two points of the edge.
function Edge(p0, p1)
{
	this.p0 = p0;
	this.p1 = p1;
}

function VertexPathfinder(grid, unitMgr)
{
	this.grid = grid;
	this.unitMgr = unitMgr;

	this.QuadrantEnum = {
		QUADRANT_NONE : 0,
		QUADRANT_BL : 1,
		QUADRANT_TR : 2,
		QUADRANT_TL : 4,
		QUADRANT_BR : 8,
		QUADRANT_BLTR : 1 | 2,
		QUADRANT_TLBR : 4 | 8,
		QUADRANT_ALL : 1 | 2 | 4 | 8	
	}

	// When computing vertexes to insert into the search graph,
	// add a small delta so that the vertexes of an edge don't get interpreted
	// as crossing the edge (given minor numerical inaccuracies)
	this.EDGE_EXPAND_DELTA = 1/16;
	this.NAVCELL_SIZE = 1;
}


/**
 * Add edges and vertexes to represent the boundaries between passable and impassable
 * navcells (for impassable terrain).
 * Navcells i0 <= i <= i1, j0 <= j <= j1 will be considered.
 */
VertexPathfinder.prototype.AddTerrainEdges = function(i0, i1, j0, j1, vertexes, edges)
{
	// Clamp the coordinates so we won't attempt to sample outside of the grid.
	i0 = clamp(i0, 1, this.grid.width-2);
	j0 = clamp(j0, 1, this.grid.height-2);
	i1 = clamp(i1, 1, this.grid.width-2);
	j1 = clamp(j1, 1, this.grid.height-2);

	for (let j = j0; j <= j1; ++j)
	{
		for (let i = i0; i <= i1; ++i)
		{
			if (this.grid.IsPassable(i, j))
				continue;

			if (this.grid.IsPassable(i+1, j) && this.grid.IsPassable(i, j+1) && this.grid.IsPassable(i+1, j+1))
			{
				let vert = new Vertex();
				vert.status = Vertex.StatusEnum.UNEXPLORED;
				vert.quadOutward = this.QuadrantEnum.QUADRANT_ALL;
				vert.quadInward = this.QuadrantEnum.QUADRANT_BL;
				vert.p = new Vector2D(i + 1 + this.EDGE_EXPAND_DELTA, j + 1 + this.EDGE_EXPAND_DELTA).Multiply(this.NAVCELL_SIZE);
				vertexes.push(vert);
			}

			if (this.grid.IsPassable(i-1, j) && this.grid.IsPassable(i, j+1) && this.grid.IsPassable(i-1, j+1))
			{
				let vert = new Vertex();
				vert.status = this.QuadrantEnum.UNEXPLORED;
				vert.quadOutward = this.QuadrantEnum.QUADRANT_ALL;
				vert.quadInward =  this.QuadrantEnum.QUADRANT_BR;
				vert.p = new Vector2D(i - this.EDGE_EXPAND_DELTA, j + 1 + this.EDGE_EXPAND_DELTA).Multiply(this.NAVCELL_SIZE);
				vertexes.push(vert);
			}

			if (this.grid.IsPassable(i+1, j), passClass) && this.grid.IsPassable(i, j-1) && this.grid.IsPassable(i+1, j-1))
			{
				let vert = new Vertex();
				vert.status = this.QuadrantEnum.UNEXPLORED;
				vert.quadOutward = this.QuadrantEnum.QUADRANT_ALL;
				vert.quadInward =  this.QuadrantEnum.QUADRANT_TL;
				vert.p = new Vector2D(i + 1 + this.EDGE_EXPAND_DELTA, j - this.EDGE_EXPAND_DELTA).Multiply(this.NAVCELL_SIZE);
				vertexes.push(vert);
			}

			if (this.grid.IsPassable(i-1, j) && this.grid.IsPassable(i, j-1) && this.grid.IsPassable(i-1, j-1))
			{
				let vert = new Vertex();
				vert.status = this.QuadrantEnum.UNEXPLORED;
				vert.quadOutward = this.QuadrantEnum.QUADRANT_ALL;
				vert.quadInward =  this.QuadrantEnum.QUADRANT_TR;
				vert.p = new Vector2D(i - this.EDGE_EXPAND_DELTA, j - this.EDGE_EXPAND_DELTA).Multiply(this.NAVCELL_SIZE);
				vertexes.push(vert);
			}
		}
	}

	for (int j = j0; j < j1; ++j)
	{
		let segmentsR = [];
		let segmentsL = [];
		for (let i = i0; i <= i1; ++i)
		{
			bool a = this.grid.IsPassable(i, j+1);
			bool b = this.grid.IsPassable(i, j);
			if (a && !b)
				segmentsL.push(i);
			if (b && !a)
				segmentsR.push(i);
		}

		if (segmentsR.length != 0)
		{
			segmentsR.push(0); // sentinel value to simplify the loop
			let ia = segmentsR[0];
			let ib = ia + 1;
			for (let n = 1; n < segmentsR.length; ++n)
			{
				if (segmentsR[n] == ib)
					++ib;
				else
				{
					let v0 = new Vector2D(ia, j + 1).Multiply(this.NAVCELL_SIZE);
					let v1 = new Vector2D(ib, j + 1).Multiply(this.NAVCELL_SIZE);
					edges.push(new Edge(v0, v1));

					ia = segmentsR[n];
					ib = ia + 1;
				}
			}
		}

		if (segmentsL.length != 0)
		{
			segmentsL.push(0); // sentinel value to simplify the loop
			let ia = segmentsL[0];
			let ib = ia + 1;
			for (let n = 1; n < segmentsL.length; ++n)
			{
				if (segmentsL[n] == ib)
					++ib;
				else
				{
					let v0 = new Vector2D(ib, j + 1).Multiply(this.NAVCELL_SIZE);
					let v1 = new Vector2D(ia, j + 1).Multiply(this.NAVCELL_SIZE);
					edges.push(new Edge(v0, v1));

					ia = segmentsL[n];
					ib = ia + 1;
				}
			}
		}
	}

	for (let i = i0; i < i1; ++i)
	{
		let segmentsU = [];
		let segmentsD = [];
		for (let j = j0; j <= j1; ++j)
		{
			let a = this.grid.IsPassable(i+1, j);
			let b = this.grid.IsPassable(i, j);
			if (a && !b)
				segmentsU.push(j);
			if (b && !a)
				segmentsD.push(j);
		}

		if (segmentsU.length != 0)
		{
			segmentsU.push(0); // sentinel value to simplify the loop
			let ja = segmentsU[0];
			let jb = ja + 1;
			for (let n = 1; n < segmentsU.length; ++n)
			{
				if (segmentsU[n] == jb)
					++jb;
				else
				{
					let v0 = new Vector2D(i + 1, ja).Multiply(this.NAVCELL_SIZE);
					let v1 = new Vector2D(i + 1, jb).Multiply(this.NAVCELL_SIZE);
					edges.push(new Edge(v0, v1));

					ja = segmentsU[n];
					jb = ja + 1;
				}
			}
		}

		if (segmentsD.length != 0)
		{
			segmentsD.push(0); // sentinel value to simplify the loop
			let ja = segmentsD[0];
			let jb = ja + 1;
			for (let n = 1; n < segmentsD.length; ++n)
			{
				if (segmentsD[n] == jb)
					++jb;
				else
				{
					let v0 = new Vector2D(i + 1, fjb).Multiply(this.NAVCELL_SIZE);
					let v1 = new Vector2D(i + 1, ja).Multiply(this.NAVCELL_SIZE);
					edges.push(new Edge(v0, v1));

					ja = segmentsD[n];
					jb = ja + 1;
				}
			}
		}
	}
}

VertexPathfinder.prototype.UnitObstructionEdges = function(vertexes, edges, x0, x1, z0, z1)
{
	
}

// x0: 		x-coordinate of start-point
// z0: 		z-coordinate of start-point
// clearance:	clearance of the unit pathing
// range:	search within this range of start (in positive and negative x and z direction)
// goal:	the goal to search a path to (a point as Vector2D)
// retPath:	the path returned as an array of Vector2D points
//
// Compared to the original function we only use poitn-goals
VertexPathfinder.prototype.ComputeShortPath = function(x0, z0, clearance, range, goal, retPath)
{
	// List of collision edges - paths must never cross these.
	// (Edges are one-sided so intersections are fine in one direction, but not the other direction.)
	var edges = [];
	//edgeSquares.clear(); // axis-aligned squares; equivalent to 4 edges

	// Create impassable edges at the max-range boundary, so we can't escape the region
	// where we're meant to be searching
	var rangeXMin = x0 - range;
	var rangeXMax = x0 + range;
	var rangeZMin = z0 - range;
	var rangeZMax = z0 + range;

	// we don't actually add the "search space" edges as edges, since we may want to cross them
	// in some cases (such as if we need to go around an obstruction that's partly out of the search range)

	// List of obstruction vertexes (plus start/end points); we'll try to find paths through
	// the graph defined by these vertexes
	var vertexes = [];

	// Add the start point to the graph
	var posStart = new Vector2D(x0, z0);
	var hStart = (posStart - goal.length()); //goal.NearestPointOnGoal(posStart)).Length();
	
	var start = new Vertex();
	start.p = new Vector2D(hStart.x, hStart.y); // TODO: is a copy really needed and if so, is there an cleaner way?
	start.g = 0.0;
	start.h = hStart;
	start.pred = 0;
	start.status = Vertex.StatusEnum.OPEN;
	start.quadInward = this.QuadrantEnum.QUADRANT_NONE;
	start.quadOutward = this.QuadrantEnum.QUADRANT_ALL;

	vertexes.push(start);
	var START_VERTEX_ID = 0;

	// Add the goal vertex to the graph.
	// We only use point goal in this version (compared to original 0 A.D. code)
	var end = new Vector2D(goal.x, goal.y);
	vertexes.push(end);
	var GOAL_VERTEX_ID = 1;

	// TODO: Unit obstructions 
	// ... original code had obstruction squares here

	// Add terrain obstructions
	{
		let i0, j0, i1, j1;
		this.grid.GetCellId(rangeXMin, rangeZMin, i0, j0);
		this.grid.GetCellId(rangeXMax, rangeZMax, i1, j1);
		this.AddTerrainEdges(i0, i1, j0, j1, vertexes, edges);
	}
// TODO: Continue here...


	// Do an A* search over the vertex/visibility graph:

	// Since we are just measuring Euclidean distance the heuristic is admissible,
	// so we never have to re-examine a node once it's been moved to the closed set.

	// To save time in common cases, we don't precompute a graph of valid edges between vertexes;
	// we do it lazily instead. When the search algorithm reaches a vertex, we examine every other
	// vertex and see if we can reach it without hitting any collision edges, and ignore the ones
	// we can't reach. Since the algorithm can only reach a vertex once (and then it'll be marked
	// as closed), we won't be doing any redundant visibility computations.

	PROFILE_START("Short pathfinding - A*");

	VertexPriorityQueue open;
	VertexPriorityQueue::Item qiStart = { START_VERTEX_ID, start.h, start.h };
	open.push(qiStart);

	u16 idBest = START_VERTEX_ID;
	fixed hBest = start.h;

	while (!open.empty())
	{
		// Move best tile from open to closed
		VertexPriorityQueue::Item curr = open.pop();
		vertexes[curr.id].status = Vertex::CLOSED;

		// If we've reached the destination, stop
		if (curr.id == GOAL_VERTEX_ID)
		{
			idBest = curr.id;
			break;
		}

		// Sort the edges by distance in order to check those first that have a high probability of blocking a ray.
		// The heuristic based on distance is very rough, especially for squares that are further away;
		// we're also only really interested in the closest squares since they are the only ones that block a lot of rays.
		// Thus we only do a partial sort; the threshold is just a somewhat reasonable value.
		if (edgeSquares.size() > 8)
			std::partial_sort(edgeSquares.begin(), edgeSquares.begin() + 8, edgeSquares.end(), SquareSort(vertexes[curr.id].p));

		edgesUnaligned.clear();
		edgesLeft.clear();
		edgesRight.clear();
		edgesBottom.clear();
		edgesTop.clear();
		SplitAAEdges(vertexes[curr.id].p, edges, edgeSquares, edgesUnaligned, edgesLeft, edgesRight, edgesBottom, edgesTop);

		// Check the lines to every other vertex
		for (size_t n = 0; n < vertexes.size(); ++n)
		{
			if (vertexes[n].status == Vertex::CLOSED)
				continue;

			// If this is the magical goal vertex, move it to near the current vertex
			CFixedVector2D npos;
			if (n == GOAL_VERTEX_ID)
			{
				npos = goal.NearestPointOnGoal(vertexes[curr.id].p);

				// To prevent integer overflows later on, we need to ensure all vertexes are
				// 'close' to the source. The goal might be far away (not a good idea but
				// sometimes it happens), so clamp it to the current search range
				npos.X = clamp(npos.X, rangeXMin, rangeXMax);
				npos.Y = clamp(npos.Y, rangeZMin, rangeZMax);
			}
			else
				npos = vertexes[n].p;

			// Work out which quadrant(s) we're approaching the new vertex from
			u8 quad = 0;
			if (vertexes[curr.id].p.X <= npos.X && vertexes[curr.id].p.Y <= npos.Y) quad |= QUADRANT_BL;
			if (vertexes[curr.id].p.X >= npos.X && vertexes[curr.id].p.Y >= npos.Y) quad |= QUADRANT_TR;
			if (vertexes[curr.id].p.X <= npos.X && vertexes[curr.id].p.Y >= npos.Y) quad |= QUADRANT_TL;
			if (vertexes[curr.id].p.X >= npos.X && vertexes[curr.id].p.Y <= npos.Y) quad |= QUADRANT_BR;

			// Check that the new vertex is in the right quadrant for the old vertex
			if (!(vertexes[curr.id].quadOutward & quad))
			{
				// Hack: Always head towards the goal if possible, to avoid missing it if it's
				// inside another unit
				if (n != GOAL_VERTEX_ID)
					continue;
			}

			bool visible =
				CheckVisibilityLeft(vertexes[curr.id].p, npos, edgesLeft) &&
				CheckVisibilityRight(vertexes[curr.id].p, npos, edgesRight) &&
				CheckVisibilityBottom(vertexes[curr.id].p, npos, edgesBottom) &&
				CheckVisibilityTop(vertexes[curr.id].p, npos, edgesTop) &&
				CheckVisibility(vertexes[curr.id].p, npos, edgesUnaligned);

			/*
			// Render the edges that we examine
			m_DebugOverlayShortPathLines.push_back(SOverlayLine());
			m_DebugOverlayShortPathLines.back().m_Color = visible ? CColor(0, 1, 0, 0.5) : CColor(1, 0, 0, 0.5);
			std::vector<float> xz;
			xz.push_back(vertexes[curr.id].p.X.ToFloat());
			xz.push_back(vertexes[curr.id].p.Y.ToFloat());
			xz.push_back(npos.X.ToFloat());
			xz.push_back(npos.Y.ToFloat());
			SimRender::ConstructLineOnGround(GetSimContext(), xz, m_DebugOverlayShortPathLines.back(), false);
			*/

			if (visible)
			{
				fixed g = vertexes[curr.id].g + (vertexes[curr.id].p - npos).Length();

				// If this is a new tile, compute the heuristic distance
				if (vertexes[n].status == Vertex::UNEXPLORED)
				{
					// Add it to the open list:
					vertexes[n].status = Vertex::OPEN;
					vertexes[n].g = g;
					vertexes[n].h = goal.DistanceToPoint(npos);
					vertexes[n].pred = curr.id;

					// If this is an axis-aligned shape, the path must continue in the same quadrant
					// direction (but not go into the inside of the shape).
					// Hack: If we started *inside* a shape then perhaps headed to its corner (e.g. the unit
					// was very near another unit), don't restrict further pathing.
					if (vertexes[n].quadInward && !(curr.id == START_VERTEX_ID && g < fixed::FromInt(8)))
						vertexes[n].quadOutward = ((~vertexes[n].quadInward) & quad) & 0xF;

					if (n == GOAL_VERTEX_ID)
						vertexes[n].p = npos; // remember the new best goal position

					VertexPriorityQueue::Item t = { (u16)n, g + vertexes[n].h, vertexes[n].h };
					open.push(t);

					// Remember the heuristically best vertex we've seen so far, in case we never actually reach the target
					if (vertexes[n].h < hBest)
					{
						idBest = (u16)n;
						hBest = vertexes[n].h;
					}
				}
				else // must be OPEN
				{
					// If we've already seen this tile, and the new path to this tile does not have a
					// better cost, then stop now
					if (g >= vertexes[n].g)
						continue;

					// Otherwise, we have a better path, so replace the old one with the new cost/parent
					fixed gprev = vertexes[n].g;
					vertexes[n].g = g;
					vertexes[n].pred = curr.id;

					// If this is an axis-aligned shape, the path must continue in the same quadrant
					// direction (but not go into the inside of the shape).
					if (vertexes[n].quadInward)
						vertexes[n].quadOutward = ((~vertexes[n].quadInward) & quad) & 0xF;

					if (n == GOAL_VERTEX_ID)
						vertexes[n].p = npos; // remember the new best goal position

					open.promote((u16)n, gprev + vertexes[n].h, g + vertexes[n].h, vertexes[n].h);
				}
			}
		}
	}

	// Reconstruct the path (in reverse)
	for (u16 id = idBest; id != START_VERTEX_ID; id = vertexes[id].pred)
		path.m_Waypoints.emplace_back(Waypoint{ vertexes[id].p.X, vertexes[id].p.Y });	
}

