// ============================================
// MANIFESTO — Constellation Graph
// Custom Canvas Physics Engine for Goal Nodes
// ============================================

export class ConstellationGraph {
  constructor(container, week, onClickNode) {
    this.container = container;
    this.week = week;
    this.onClickNode = onClickNode; // (goalId) => void
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.nodes = [];
    this.links = [];
    this.animationId = null;
    
    this.mouse = { x: null, y: null, down: false };
    this.draggedNode = null;
    this.hoveredNode = null;

    this.colors = {
      done: '#00d4ff',
      'in-progress': '#7c3aed',
      todo: '#4a5568',
      center: '#ffffff'
    };

    this.resize = this.resize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.loop = this.loop.bind(this);

    this.init();
  }

  init() {
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);
    
    this.resize();
    this.buildGraph();
    this.loop();
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    cancelAnimationFrame(this.animationId);
    this.container.innerHTML = '';
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight || 400;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  buildGraph() {
    this.nodes = [];
    this.links = [];
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Central Node (The Week)
    const centerNode = {
      id: 'center',
      isCenter: true,
      title: this.week.label,
      x: cx,
      y: cy,
      vx: 0, vy: 0,
      radius: 30,
      color: this.colors.center
    };
    this.nodes.push(centerNode);

    // Goal Nodes
    this.week.goals.forEach((goal, i) => {
      const angle = (i / this.week.goals.length) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      this.nodes.push({
        id: goal.id,
        isCenter: false,
        title: goal.title,
        status: goal.status,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        radius: goal.status === 'done' ? 18 : (goal.status === 'in-progress' ? 22 : 14),
        color: this.colors[goal.status] || this.colors.todo
      });
    });

    // Link all goals to center
    for (let i = 1; i < this.nodes.length; i++) {
      this.links.push({
        source: this.nodes[0],
        target: this.nodes[i],
        distance: 150
      });
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    if (this.draggedNode) {
      this.draggedNode.x = this.mouse.x;
      this.draggedNode.y = this.mouse.y;
    } else {
      // Hover detection
      this.hoveredNode = null;
      for (const node of this.nodes) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        if (dx * dx + dy * dy < node.radius * node.radius * 4) {
          this.hoveredNode = node;
          break;
        }
      }
      this.canvas.style.cursor = this.hoveredNode && !this.hoveredNode.isCenter ? 'pointer' : 'default';
    }
  }

  onMouseDown() {
    this.mouse.down = true;
    if (this.hoveredNode && !this.hoveredNode.isCenter) {
      this.draggedNode = this.hoveredNode;
    }
  }

  onMouseUp() {
    this.mouse.down = false;
    if (this.draggedNode) {
      this.draggedNode = null;
    } else if (this.hoveredNode && !this.hoveredNode.isCenter) {
      if (this.onClickNode) this.onClickNode(this.hoveredNode.id);
    }
  }

  applyPhysics() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const damping = 0.85;
    const repulsion = 2000;
    const centerPull = 0.05;

    // Repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        let distSq = dx * dx + dy * dy;
        if (distSq === 0) distSq = 1;
        
        if (distSq < 100000) {
          const force = repulsion / distSq;
          const fx = (dx / Math.sqrt(distSq)) * force;
          const fy = (dy / Math.sqrt(distSq)) * force;
          
          if (!n1.isCenter && n1 !== this.draggedNode) {
            n1.vx += fx; n1.vy += fy;
          }
          if (!n2.isCenter && n2 !== this.draggedNode) {
            n2.vx -= fx; n2.vy -= fy;
          }
        }
      }
    }

    // Springs for links
    for (const link of this.links) {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = (link.distance - dist) * 0.05;
      
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!link.source.isCenter && link.source !== this.draggedNode) {
        link.source.vx -= fx; link.source.vy -= fy;
      }
      if (!link.target.isCenter && link.target !== this.draggedNode) {
        link.target.vx += fx; link.target.vy += fy;
      }
    }

    // Apply velocities
    for (const node of this.nodes) {
      if (node.isCenter) {
        node.x = cx; node.y = cy;
      } else if (node !== this.draggedNode) {
        // Center gravity
        node.vx += (cx - node.x) * centerPull;
        node.vy += (cy - node.y) * centerPull;

        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Links
    this.ctx.lineWidth = 1.5;
    for (const link of this.links) {
      this.ctx.beginPath();
      this.ctx.moveTo(link.source.x, link.source.y);
      this.ctx.lineTo(link.target.x, link.target.y);
      
      if (link.target.status === 'done') {
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
      } else if (link.target.status === 'in-progress') {
        this.ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      }
      this.ctx.stroke();
    }

    // Draw Nodes
    for (const node of this.nodes) {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      if (node.isCenter) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = node.color;
        this.ctx.fill();
        
        // Glow effect for active/done
        if (node.status === 'done' || node.status === 'in-progress') {
          this.ctx.shadowColor = node.color;
          this.ctx.shadowBlur = 15;
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }

        if (this.hoveredNode === node) {
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }
      }
      
      // Text
      this.ctx.fillStyle = '#fff';
      this.ctx.font = node.isCenter ? 'bold 16px Inter' : '12px Inter';
      this.ctx.textAlign = 'center';
      
      // Node Label Background for readability
      if (!node.isCenter) {
        const textW = this.ctx.measureText(node.title).width;
        this.ctx.fillStyle = 'rgba(10, 14, 26, 0.7)';
        this.ctx.fillRect(node.x - textW/2 - 4, node.y + node.radius + 6, textW + 8, 18);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(node.title, node.x, node.y + node.radius + 18);
      } else {
        this.ctx.fillText(node.title, node.x, node.y + 6);
      }
    }
  }

  loop() {
    this.applyPhysics();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  }
}
