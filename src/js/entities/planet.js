// requires: entities/entity.js

Payload.Planet = function(world, options)
{
	this.fixtureDestructionQueue = [];
	this.fixturesByFaceIndex = [];
	
	// NB: Do this here because initMesh is called before Entity sets it
	this.world = world;
	
	this.initMesh(options);
	
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Planet, Payload.Entity);

Payload.Planet.spherize = function(img)
{
	var size = 512;
	var src = document.createElement("canvas");
	
	src.width = size;
	src.height = size;
	
	var srcctx = src.getContext("2d");
	srcctx.drawImage(img, 0, 0);
	
	var dst		= document.createElement("canvas");
	dst.width = dst.height = size;
	
	var dstctx	= dst.getContext("2d");
	
	dstctx.fillStyle = "red";
	dstctx.fillRect(0, 0, 512, 512);
	
	var srcpixels = srcctx.getImageData(0, 0, size, size).data;
	var dstpixels = srcpixels.slice();
	
	dstpixels.fill(0);
	
	function copyPixel(srcx, srcy, dstx, dsty)
	{
		var srcpos = (4 * srcy * size) + (4 * srcx);
		var dstpos = (4 * dsty * size) + (4 * dstx);
		
		dstpixels[dstpos]	= srcpixels[srcpos];
		dstpixels[dstpos+1]	= srcpixels[srcpos+1];
		dstpixels[dstpos+2]	= srcpixels[srcpos+2];
		dstpixels[dstpos+3]	= srcpixels[srcpos+3];
	}
	
	for(var y = 0; y < size; y++)
	{
		var ny	= ((2 * y) / size) - 1;
		var ny2	= ny * ny;
		
		for(var x = 0; x < size; x++)
		{
			var nx		= ((2 * x) / size) - 1;
			var nx2		= nx * nx;
			
			var r		= Math.sqrt(nx2 + ny2);
			
			if(r > 1)
				continue;
			
			var nr		= Math.sqrt(1 - r * r);
			nr			= (r + (1.0 - nr)) / 2;
			
			if(nr > 1)
				continue;
			
			var theta	= Math.atan2(ny, nx);
			var nxn		= nr * Math.cos(theta);
			var nyn		= nr * Math.sin(theta);
			var x2		= parseInt( ((nxn+1) * size) / 2 );
			var y2		= parseInt( ((nyn+1) * size) / 2 );
			
			copyPixel(x2, y2, x, y);
		}
	}
	
	var temp = new ImageData(size, size);
	temp.data.set(dstpixels);
	
	srcctx.putImageData(temp, 0, 0);
	
	return src;
}

Payload.Planet.prototype.initMesh = function(options)
{
	var minRadius = this.world.options.planet.radius.minimum;
	var maxRadius = this.world.options.planet.radius.maximum;
	
	var radius = this._radius = minRadius + (Math.random() * Math.round(maxRadius - minRadius));
	var density = this._density = 0.5 + (Math.random() * 2);
	
	var area = this._area		= Math.PI * Math.pow(radius, 2);
	var sides = this._sides		= Math.round( Math.sqrt(radius) * Math.PI );
	var cx = 0;
	var cy = 0;
	
	var sites = [];
	
	for(var i = 0; i < sides; i++)
	{
		var angle = (i / sides) * Math.PI * 2;
	
		sites.push([
			cx + Math.sin(angle) * radius,
			cy + Math.cos(angle) * radius
		]);
	}
	
	var power	= 2;	// Higher powers will bias points towards the surface, 2 will give an even distribution
	var inner	= Math.round(Math.sqrt(area)) * density;
	
	for(var i = 0; i < inner; i++)
	{
		var a = Math.random() * 2 * Math.PI;
		var r = radius * Math.pow(Math.random(), 1 / power);
		
		sites.push([
			cx + Math.sin(a) * r,
			cy + Math.cos(a) * r
		]);
	}
	
	var delaunator	= Delaunator.from(sites);
	
	this._vertices	= sites;
	this._indices	= delaunator.triangles;
}

Payload.Planet.prototype.initPhysics = function(options)
{
	var sites		= this._vertices;
	var triangles	= this._indices;
	
	this._destructionGravityMultiplier = 1;
	this.b2CenterOfGravity = new Box2D.b2Vec2();
	
	this.b2BodyDef	= new Box2D.b2BodyDef();
	
	this.b2Body		= this.world.b2World.CreateBody(this.b2BodyDef);
	
	function convertPoint(point, scale)
	{
		if(!scale)
			scale = 1;
		
		return new Box2D.b2Vec2(
			point[0] * scale,
			point[1] * scale
		);
	}
	
	function createPolygonShape(vertices) {
		var shape = new Box2D.b2PolygonShape();
		// var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
		var buffer = Box2D._malloc(vertices.length * 8);
		var offset = 0;
		for (var i = 0; i < vertices.length; i++) {
			// Box2D.setValue(buffer + (offset), vertices[i].get_x(), 'float'); // x
			Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].get_x();
			// Box2D.setValue(buffer + (offset + 4), vertices[i].get_y(), 'float'); // y
			Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].get_y();
			offset += 8;
		}
		var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
		shape.Set(ptr_wrapped, vertices.length);
		return shape;
	}
	
	for(var i = 0; i < triangles.length; i += 3)
	{
		var vertices = [];
		
		vertices.push( convertPoint(sites[triangles[i+2]], Payload.Units.GRAPHICS_TO_PHYSICS) );
		vertices.push( convertPoint(sites[triangles[i+1]], Payload.Units.GRAPHICS_TO_PHYSICS) );
		vertices.push( convertPoint(sites[triangles[i]]  , Payload.Units.GRAPHICS_TO_PHYSICS) );
		vertices.push( convertPoint(sites[triangles[i+2]], Payload.Units.GRAPHICS_TO_PHYSICS) );
		
		var shape = createPolygonShape(vertices);
		
		var fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(this._density);
		fixtureDef.set_friction(this.world.options.planet.friction);
		fixtureDef.set_restitution(this.world.options.planet.restitution);
		fixtureDef.set_shape(shape);
		
		var fixture = this.b2Body.CreateFixture(fixtureDef);
		this.fixturesByFaceIndex[parseInt(i / 3)] = fixture;
	}
}

Payload.Planet.prototype.initGraphics = function()
{
	// Materials first
	var materials = {
		"damage":	null,
		"surface":	null
	};
	
	for(var type in materials)
	{
		var asset	= payload.assets.textures.planet[type].random();
		var canvas	= Payload.Planet.spherize(asset.resource.image);
		
		materials[type] = new THREE.MeshBasicMaterial();
		materials[type].map = new THREE.CanvasTexture(canvas);
	}
	
	// Now build a mesh
	var v;
	
	this.object3d = new THREE.Object3D();
	
	this.damage = new THREE.Mesh(
		new THREE.CircleGeometry(this._radius, this._sides),
		materials.damage
	);
	this.object3d.add(this.damage);
	
	this.geometry = new THREE.Geometry();
	
	for(var i = 0; i < this._vertices.length; i++)
	{
		v = this._vertices[i];
		this.geometry.vertices.push(new THREE.Vector3(v[0], v[1], 0));
	}
	
	for(var i = 0; i < this._indices.length; i += 3)
	{
		var faceIndex	= parseInt(i / 3);
		var fixture		= this.fixturesByFaceIndex[faceIndex];
		
		var face = new THREE.Face3(
			this._indices[i],
			this._indices[i + 1],
			this._indices[i + 2]
		);
		
		face.fixture = fixture;
		fixture.face = face;
		
		this.geometry.faces.push(face);
		
		var faceUVs = [];
		var radius2	= this._radius * 2;
		
		for(var j = 0; j < 3; j++)
		{
			var vertex = this._vertices[ this._indices[i + j] ];
			var vector = new THREE.Vector2(
				0.5 + (vertex[0] / radius2),
				0.5 + (vertex[1] / radius2)
			);
			
			faceUVs.push(vector);
		}
		
		this.geometry.faceVertexUvs[0].push(faceUVs);
	}
	
	this.object3d = new THREE.Mesh(this.geometry, materials.surface);
	
	delete this.fixturesByFaceIndex;
}