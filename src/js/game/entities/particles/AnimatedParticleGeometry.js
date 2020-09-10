import {PlaneGeometry, Vector2} from "THREE";

export default class AnimatedParticleGeometry extends PlaneGeometry
{
	constructor(size, cells, frames)
	{
		super(size, size);
		
		Payload.assert(cells instanceof THREE.Vector2);
		Payload.assert(Number.isInteger(frames));
		
		this._size = size;
		this._cells = cells;
		this._numFrames = frames;
		
		this._frame = 0;
	}
	
	clone()
	{
		return new AnimatedParticleGeometry(this._size, this._cells, this._numFrames);
	}
	
	get frame()
	{
		return this._frame;
	}
	
	set frame(value)
	{
		let frame	= value % this._numFrames;
		let column	= frame % this._cells.x;
		let row		= Math.floor(frame / this._cells.x);
		let faces	= this.faceVertexUvs[0];
		
		let w		= 1 / this._cells.x;
		let h		= -1 / this._cells.y;
		
		let x		= w * column;
		let y		= 1 - (-h * row);
		
		faces[0][0].x = x;
		faces[0][0].y = y + h;
		
		faces[0][1].x = x;
		faces[0][1].y = y;
		
		faces[0][2].x = x + w;
		faces[0][2].y = y + h;
		
		faces[1][0].x = x;
		faces[1][0].y = y;
		
		faces[1][1].x = x + w;
		faces[1][1].y = y;
		
		faces[1][2].x = x + w;
		faces[1][2].y = y + h;
		
		this.uvsNeedUpdate = true;
		
		this._frame = frame;
	}
}