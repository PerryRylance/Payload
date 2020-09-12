import Entity from "./Entity";
import Units from "../Units";

export default class Ship extends Entity
{
	constructor(world, options)
	{
		super(world, options);
	}
	
	initPhysics(options)
	{
		this.b2BodyDef = new Box2D.b2BodyDef();
		this.b2BodyDef.set_type( Box2D.b2_dynamicBody );
		
		this.b2Body	= this.world.b2World.CreateBody(this.b2BodyDef);
		this.b2Body.SetAngularDamping(options.angularDamping);
		
		super.initPhysics(options);
		
		var radius	= options.radius * Units.GRAPHICS_TO_PHYSICS;
		var shape	= new Box2D.b2PolygonShape();
		
		shape.SetAsBox(radius, radius);
		
		var fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(options.density);
		fixtureDef.set_friction(options.friction);
		fixtureDef.set_restitution(options.restitution);
		fixtureDef.set_shape(shape);
		
		this.b2Body.CreateFixture(fixtureDef);
	}
	
	initGraphics(options)
	{
		super.initGraphics(options);
		
		this.object3d = new THREE.Object3D();
		
		let radius = options.radius;
		let bbox = new THREE.Box3();
		
		// Temporary code
		this.model = payload.assets.models.ships.assets["Low_poly_UFO.obj"].resource;
		this.material = payload.assets.models.ships.assets["Low_poly_UFO.mtl"].resource.materials.UFO_texture;
		
		// Temporary, remove alpha map
		this.material.alphaMap = null;
		
		// Apply the material
		this.model.traverse( (child) => {
			
			if(child.isMesh)
				child.material = this.material;
			
		} );
		
		// Correct rotation
		this.model.rotation.x = 90 * Math.PI / 180;

		// Scale the modal to match the ships radius
		bbox.setFromObject(this.model);
		
		let scale = radius / Math.abs( Math.max(
			bbox.min.x - bbox.max.x,
			bbox.min.y - bbox.max.y,
			bbox.min.z - bbox.max.z,
		)) * 2;
		
		this.model.scale.set(scale, scale, scale);
		
		// Isometric display
		this.object3d.add(this._makeIsometric(this.model));
		
		// Debugging...
		/*var geometry = new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
		var material = new THREE.MeshBasicMaterial({color: 0xff0000});
		var mesh = new THREE.Mesh(geometry, material);
		this.box = mesh;
		this.object3d.add(mesh);*/
		
		this.zIndex = 100;
	}
}