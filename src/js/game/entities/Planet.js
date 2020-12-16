import {Delaunay} from "d3-delaunay";

import Entity from "./Entity";
import Units from "../Units";

export default class Planet extends Entity
{
	constructor(world, options)
	{
		super(world, options);
	}
	
	get isAffectedByGravity()
	{
		return false;
	}
	
	spherize(img)
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
	
	initSites(options)
	{
		var game		= this.world.game;
		
		var minRadius	= this.world.options.planet.radius.minimum;
		var maxRadius	= this.world.options.planet.radius.maximum;
		
		var radius		= this._radius = minRadius + (game.random() * Math.round(maxRadius - minRadius));
		var density		= this._density = 0.5 + (game.random() * 1);
		
		var area		= this._area		= Math.PI * Math.pow(radius, 2);
		var sides		= this._sides		= Math.round( Math.sqrt(radius) * Math.PI );
		
		var sites = [];
		
		// Outer sites
		for(var i = 0; i < sides; i++)
		{
			var angle = (i / sides) * Math.PI * 2;
		
			sites.push([
				Math.sin(angle) * radius,
				Math.cos(angle) * radius
			]);
		}
		
		this.sites = sites;
		
		// Inner sites
		var power	= 2;	// Higher powers will bias points towards the surface, 2 will give an even distribution
		var inner	= Math.round(Math.sqrt(area) / 8);// * density;
		
		for(var i = 0; i < inner; i++)
		{
			// NB: This isn't uniform
			var a = game.random() * 2 * Math.PI;
			var r = radius * Math.pow(game.random(), 1 / power);
			
			sites.push([
				Math.sin(a) * r,
				Math.cos(a) * r
			]);
		}
	}
	
	initPolygons(options)
	{
		let radius = this._radius;
		let minx = Infinity;
		let miny = Infinity;
		let maxx = -Infinity;
		let maxy = -Infinity;
		
		for(var i = 0; i < this.sites.length; i++)
		{
			var site = this.sites[i];
			
			minx = Math.min(minx, site[0]);
			maxx = Math.max(maxx, site[0]);
			
			miny = Math.min(miny, site[1]);
			maxy = Math.max(maxy, site[1]);
		}
		
		let bounds = [minx, miny, maxx, maxy];
		
		let delaunay = Delaunay.from(this.sites);
		let voronoi = delaunay.voronoi(bounds);
		
		this.polygons = [];
		
		function split(points)
		{
			var half = Math.floor(points.length / 2);
			
			var a = [];
			var b = [];
			
			for(var i = 0; i <= half; i++)
				a.push(points[i]);
			a.push(points[0]);
			
			for(i = half; i <= points.length; i++)
				b.push(points[i % points.length]);
			b.push(points[half]);
			
			return [a, b];
		}
		
		function limit(point)
		{
			var r2 = radius * radius;
			var d = point[0] * point[0] + point[1] * point[1];
			
			if(d <= r2)
				return point;
			
			var l = Math.sqrt(d);
			
			var result = [
				point[0] / l * radius,
				point[1] / l * radius
			];
			
			return result;
		}
		
		for(var i = 0; i < this.sites.length; i++)
		{
			var cell = voronoi.cellPolygon(i);
			var points = [];
			
			for(var j = 0; j < cell.length; j++)
				points.push(limit(cell[j]));
			
			if(points.length <= 8)
				this.polygons.push(points);
			else
				split(points).forEach( (poly) => {
					this.polygons.push(poly);
				});
		}
	}
	
	initPhysics(options)
	{
		this.initSites(options);
		this.initPolygons(options);
		
		this._destructionGravityMultiplier = 1;
		this._fixtureDestructionQueue = [];
		this._fixturesByPolygonIndex = [];
		
		this.b2CenterOfGravity	= new Box2D.b2Vec2(0, 0);
		this.b2BodyDef			= new Box2D.b2BodyDef();
		this.b2Body				= this.world.b2World.CreateBody(this.b2BodyDef);
		
		super.initPhysics(options);
		
		function convertPoint(point)
		{
			return new Box2D.b2Vec2(
				point[0] * Units.GRAPHICS_TO_PHYSICS,
				point[1] * Units.GRAPHICS_TO_PHYSICS
			);
		}
		
		function createPolygonShape(vertices)
		{
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
		
		var index = 0;
		
		this.polygons.forEach( (poly) => {
			
			var points = [];
			
			for(var key in poly)
			{
				if(key == "index")
					break;
				
				points.push(convertPoint(poly[key]));
			}
			
			var shape = createPolygonShape(points);
			
			var fixtureDef = new Box2D.b2FixtureDef();
			fixtureDef.set_density(this._density);
			fixtureDef.set_friction(this.world.options.planet.friction);
			fixtureDef.set_restitution(this.world.options.planet.restitution);
			fixtureDef.set_shape(shape);
			
			var fixture = this.b2Body.CreateFixture(fixtureDef);
			this._fixturesByPolygonIndex[index++] = fixture;
			
		} );
		
	}
	
	initGraphics(options)
	{
		var self = this;
		
		this._polygonsByFaceIndex = [];
		
		// Materials first
		var materials = {
			"damage":	null,
			"surface":	null
		};
		
		for(var type in materials)
		{
			var asset	= payload.assets.textures.planet[type].random(this.world.game);
			var canvas	= this.spherize(asset.resource.image);
			
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
		this.damage.position.set(0, 0, -10);
		this.object3d.add(this.damage);
		
		this.geometry = new THREE.Geometry();
		
		this.vertices = [];
		this.indices = [];
		
		function triangulate(polygon)
		{
			var first = self.vertices.length;	// 0
			
			for(var i = 1; i < polygon.length - 1; i++)
			{
				self._polygonsByFaceIndex[ parseInt(self.indices.length / 3) ] = polygon;
				
				// NB: This should be more optimal, unfortunately it breaks the mesh
				/*self.indices.push(first);
				
				self.indices.push(first + i);
				self.vertices.push(polygon[i]);
				
				self.indices.push(first + i + 1);
				self.vertices.push(polygon[i + 1]);*/
				
				self.indices.push(self.vertices.length);
				self.vertices.push(polygon[0]);
				
				self.indices.push(self.vertices.length);
				self.vertices.push(polygon[i]);
				
				self.indices.push(self.vertices.length);
				self.vertices.push(polygon[i + 1]);
			}
		}
		
		this.polygons.forEach( (polygon) => {
			triangulate(polygon)
		} );
		
		for(var i = 0; i < this.vertices.length; i++)
		{
			var v = this.vertices[i];
			
			this.geometry.vertices.push(new THREE.Vector3(
				v[0],
				v[1],
				0
			));
		}
		
		for(var i = 0; i < this.indices.length; i += 3)
		{
			var face = new THREE.Face3(
				this.indices[i],
				this.indices[i + 1],
				this.indices[i + 2]
			);
			
			var polygon = this._polygonsByFaceIndex[ parseInt(i / 3) ];
			
			var fixture = this._fixturesByPolygonIndex[ this.polygons.indexOf(polygon) ];
			
			face.fixture = fixture;
			
			if(!fixture.faces)
				fixture.faces = [];
			fixture.faces.push(face);
			
			var faceUVs = [];
			var radius2	= this._radius * 2;
			
			for(var j = 0; j < 3; j++)
			{
				var vertex = this.vertices[ this.indices[i + j] ];
				var vector = new THREE.Vector2(
					0.5 + (vertex[0] / radius2),
					0.5 + (vertex[1] / radius2)
				);
				
				faceUVs.push(vector);
			}
			
			this.geometry.faces.push(face);
			this.geometry.faceVertexUvs[0].push(faceUVs);
		}
		
		this.surface = new THREE.Mesh(this.geometry, materials.surface);
		this.object3d.add(this.surface);
		
		if(options.position)
			this.position = options.position;
	}
	
	getPointOnSurface(options)
	{
		var game		= this.world.game;
		var radius		= this._radius;
		var position	= this.position;
		
		if(!options)
			options = {};
		
		if(!options.angle)
			options.angle = game.random() * 2 * Math.PI;
		
		if(options.additionalRadius)
			radius += options.additionalRadius;
		
		return {
			x: position.x + (Math.cos(options.angle) * radius),
			y: position.y + (-Math.sin(options.angle) * radius)
		};
	}
	
	applyGravity(entity)
	{
		Payload.assert(entity.isAffectedByGravity);
	
		let radius	= this._radius;
		let gravity	= radius * this._destructionGravityMultiplier;
		
		let center	= new Box2D.b2Vec2(
			this.b2Body.GetWorldCenter().get_x(),
			this.b2Body.GetWorldCenter().get_y()
		);
		
		let target	= new Box2D.b2Vec2(
			entity.b2Body.GetWorldCenter().get_x(),
			entity.b2Body.GetWorldCenter().get_y()
		);
		
		let delta	= new Box2D.b2Vec2(0, 0);
		let temp	= new Box2D.b2Vec2(
			this.b2CenterOfGravity.get_x(),
			this.b2CenterOfGravity.get_y()
		);
		
		delta.op_add(target);
		delta.op_sub(center);
		delta.op_sub(temp);
		
		let distance = delta.Length();
		
		// Skip distance check distance < 3 * radius
		
		delta.Set(
			-delta.get_x(),
			-delta.get_y()
		);
		
		let sum		= Math.abs(delta.get_x()) + Math.abs(delta.get_y());
		let mult	= (1 / sum) * gravity * this._density / distance;
		
		delta.op_mul(mult);
		
		entity.b2Body.ApplyForceToCenter(delta);
		
		Box2D.destroy(center);
		Box2D.destroy(target);
		Box2D.destroy(delta);
		Box2D.destroy(temp);
	}
	
	applyFixtureDamage(fixture)
	{
		if(this._fixtureDestructionQueue.indexOf(fixture) > -1)
			return;
		
		this._fixtureDestructionQueue.push(fixture);
	}
	
	getFaceArea(face)
	{
		let va = this.vertices[face.a];
		let vb = this.vertices[face.b];
		let vc = this.vertices[face.c];
		
		let x1 = va[0];
		let x2 = vb[0];
		let x3 = vc[0];
		
		let y1 = va[1];
		let y2 = vb[1];
		let y3 = vc[1];
		
		return Math.abs(0.5*(x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2)));
	}
	
	getArea()
	{
		var area = 0;
		
		this.geometry.faces.forEach( (face) => {
			
			area += this.getFaceArea(face);
			
		});
		
		return area;
	}
	
	getFaceCentroid(face)
	{
		let va = this.vertices[face.a];
		let vb = this.vertices[face.b];
		let vc = this.vertices[face.c];
		
		let x1 = va[0];
		let x2 = vb[0];
		let x3 = vc[0];
		
		let y1 = va[1];
		let y2 = vb[1];
		let y3 = vc[1];
		
		return {
			x: (x1 + x2 + x3) / 3,
			y: (y1 + y2 + y3) / 3
		};
	}
	
	getCentroid()
	{
		let result = {
			x: 0,
			y: 0
		};
		
		this.geometry.faces.forEach( face => {
			
			var centroid = this.getFaceCentroid(face);
			result.x += centroid.x;
			result.y += centroid.y;
			
		} );
		
		result.x	/= this.geometry.faces.length;
		result.y	/= this.geometry.faces.length;
		
		return result;
	}
	
	handleMeshDestruction()
	{
		var self = this;
		var updateMesh = this._fixtureDestructionQueue.length > 0;
		
		while(this._fixtureDestructionQueue.length)
		{
			var fixture = this._fixtureDestructionQueue.pop();
			
			fixture.faces.forEach( (face) => {
				
				var index = this.geometry.faces.indexOf(face);
				this.geometry.faces.splice(index, 1);
				this.geometry.faceVertexUvs[0].splice(index, 1);
				
			} );
			
			this.b2Body.DestroyFixture(fixture);
		}
		
		if(!updateMesh)
			return;
		
		if(this.geometry.faces.length)
		{
			this.geometry.elementsNeedUpdate = true;
			this.geometry.uvsNeedUpdate = true;
		}
		else
		{
			this.remove();
			return;
		}
		
		// Calculate new center of mass and area
		let areaInitial		= Math.PI * (this._radius * this._radius);
		let areaRemaining	= this.getArea();
		
		this._destructionGravityMultiplier = areaRemaining / areaInitial;
		
		let centroid		= this.getCentroid();
		
		this.b2CenterOfGravity = new Box2D.b2Vec2(
			centroid.x * Units.GRAPHICS_TO_PHYSICS,
			centroid.y * Units.GRAPHICS_TO_PHYSICS
		);
	}
	
	handleGravity()
	{
		for(var i = 0; i < this.world.entities.length; i++)
		{
			var entity = this.world.entities[i];
			
			if(!entity.isAffectedByGravity)
				continue;
				
			this.applyGravity(entity);
		}
	}
	
	update()
	{
		super.update();
		
		this.handleGravity();
		this.handleMeshDestruction();
	}
}